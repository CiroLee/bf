#!/usr/bin/env node
import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import md5 from 'md5';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import secrets from './secrets';

const argv = yargs(hideBin(process.argv)).help(false);
const parsedArgv = argv.parseSync();
const query = parsedArgv._;
const spinner = ora({ spinner: 'line' });

function showHelper() {
  const helps = `Usage bf [options] <query>

-v,--version        output the version number
-h,--help           show help info
-lang,--language    output the list of supported languages
--from <lang>       the source language
--to <lang>         the target language
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
function renderTransResult(result: ITransResult) {
  const options = `- from: ${result.from} to: ${result.to}`;
  console.log(chalk.gray(options));
  console.log(chalk.bold.greenBright(`- ${result.trans_result[0].dst}`));
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
    renderTransResult(result);
  } catch (error) {
    console.error(error);
    spinner.stop();
  }
}

(function () {
  const { v, h, help, l, language } = parsedArgv;
  const queryString = query.join(' ').trim();

  if (queryString.length > 200) {
    console.log(chalk.hex('#b09158')('The maximum length of search term is 200 bytes'));
    process.exit(0);
  }

  const isZhSource = /[\u4E00-\u9FA5]+/.test(queryString);
  const from = (parsedArgv.from as string) || (isZhSource ? 'zh' : 'auto');
  const to = (parsedArgv.to as string) || (from === 'zh' ? 'en' : 'auto');

  if (v) {
    argv.showVersion();
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
  });
})();
