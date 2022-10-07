#!/usr/bin/env node
// import chalk from 'chalk';
import got from 'got';
import md5 from 'md5';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import secrets from './secrets';
const argv = yargs(hideBin(process.argv)).help(false);
const parsedArgv = argv.parseSync();
const query = parsedArgv._;

function showHelper() {
  const helps = `Usage bf [options] <query>
-v,--version        output the version number
-h,--help           show help info
--from <lang>       the source language
--to <lang>         the target language
  `;

  console.log(helps);
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
async function getTranslation(props: ITransProps) {
  try {
    const { sign, salt } = generateSignAndSalt(props.q);
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
      .json();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}

(function () {
  const { v, h, help } = parsedArgv;
  const queryString = query.join(' ').trim();
  const isZhSource = /[\u4E00-\u9FA5]+/.test(queryString);
  const from = (parsedArgv.from as string) || (isZhSource ? 'zh' : 'auto');
  const to = (parsedArgv.to as string) || (from === 'zh' ? 'en' : 'auto');

  if (v) {
    argv.showVersion();
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
