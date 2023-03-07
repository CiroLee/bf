#!/usr/bin/env node
import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import md5 from 'md5';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import secrets from './secrets';
import * as strCase from './case';
import pkg from './package.json';

const argv = yargs(hideBin(process.argv)).help(false).version(false).array('cases');
const parsedArgv = argv.parseSync();
const query = parsedArgv._;
const spinner = ora({ spinner: 'line' });

function showHelper() {
  const helps = `Usage bf [options] <query>

-v,--version              output the version number
-h,--help                 show help info
-lang,--language          output the list of supported languages
--from [lang]             the source language
--to [lang]               the target language
--cases [c|p|k|s|all]     convert the result using the cases 
  `;

  console.log(helps);
}

function showLanguages() {
  const langs = `Languages:
  zh(Chinese|简体中文), cht(Traditional Chinese|繁体中文),en(English|英文), yue(粤语), wyw(文言文), jp(Japanese|日语),
  kor(Korean|韩语), fra(France|法语),spa(Spanish|西班牙语), th(Thai|泰语), ara(Arabic|阿拉伯语), ru(Russian|俄语), 
  pt(Portuguese|葡萄牙语), de(German|德语), it(Italian|意大利语),el(Greek|希腊语), nl(Dutch|荷兰语), pl(Polish|波兰语), 
  bul(Bulgarian|保加利亚语), est(Estonian|爱沙尼亚语), dan(Danish|丹麦语), fin(Finnish|芬兰语), cs(Czech|捷克语), 
  rom(Romanian|罗马尼亚语), slo(Slovenian|斯洛文尼亚语), swe(Swedish|瑞典语), hu(Hungarian|匈牙利语), vie(Vietnamese|越南语)`;
  console.log(chalk.hex('#d2d2d2')(langs));
}

function generateSignAndSalt(query: string) {
  const uft8Query = query;
  const salt = Date.now();
  const sign = secrets.appid + uft8Query + salt + secrets.key;

  return {
    sign: md5(sign),
    salt,
  };
}

interface ITransProps {
  q: string;
  from?: string;
  to?: string;
  cases?: string[];
}
interface ITransResult {
  from: string;
  to: string;
  trans_result: {
    src: string;
    dst: string;
  }[];
  error_code?: string;
  error_msg?: string;
}

const caseMap = [
  { key: 'c', full: 'cameCase', cb: strCase.camelCase },
  { key: 'p', full: 'PascalCase', cb: strCase.pascalCase },
  { key: 's', full: 'snake_case', cb: strCase.snakeCase },
  { key: 'k', full: 'kebab-case', cb: strCase.kebabCase },
];
function renderTransResult(result: ITransResult, cases?: string[]) {
  const options = `- from: ${result.from} to: ${result.to}`;
  const dst = result.trans_result[0].dst;
  let dstArr: string[] = [];
  console.log(chalk.gray(options));

  if (Array.isArray(cases) && cases.length === 1 && cases[0] === 'all') {
    dstArr = caseMap.map((el) => `${chalk.gray(`- (${el.full})`)} ${chalk.bold.greenBright(el.cb(dst))}`);
  } else if (Array.isArray(cases) && !cases.includes('all')) {
    dstArr = caseMap
      .filter((item) => cases?.includes(item.key))
      .map((el) => `${chalk.gray(`- (${el.full})`)} ${chalk.bold.greenBright(el.cb(dst))}`);
  }
  if (dstArr.length) {
    const str = dstArr.join('\n');
    console.log(str);
  } else {
    console.log(chalk.bold.greenBright(`- ${dst}`));
  }
}
async function getTranslation(props: ITransProps) {
  try {
    const { sign, salt } = generateSignAndSalt(props.q);
    spinner.start();
    const result = await got
      .post('https://fanyi-api.baidu.com/api/trans/vip/translate', {
        form: {
          q: props.q,
          from: props.from,
          to: props.to,
          sign,
          salt,
          appid: secrets.appid,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .json<ITransResult>();
    if (result?.error_code) {
      throw new Error(result.error_msg);
    }
    spinner.stop();
    renderTransResult(result, props.cases);
  } catch (error) {
    console.error(error);
    spinner.stop();
  }
}

(function () {
  const { v, version, h, help, l, language, cases } = parsedArgv;
  const queryString = query.join(' ').trim();

  if (queryString.length > 200) {
    console.log(chalk.hex('#b09158')('The maximum length of search term is 200 bytes'));
    process.exit(0);
  }

  const isZhSource = /[\u4E00-\u9FA5]+/.test(queryString);
  const from = (parsedArgv.from as string) || (isZhSource ? 'zh' : 'auto');
  const to = (parsedArgv.to as string) || (from === 'zh' ? 'en' : 'auto');

  if (v || version) {
    console.log(pkg.version);
    process.exit(0);
  }
  if (l || language) {
    showLanguages();
    process.exit(0);
  }
  if (help || h || !queryString) {
    showHelper();
    process.exit(0);
  }

  getTranslation({
    q: queryString,
    from,
    to,
    cases,
  } as ITransProps);
})();
