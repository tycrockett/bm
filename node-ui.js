
const getScreenWidth = () => process.stdout.columns;
const screenHeight = process.stdout.rows;

const defaults = {
  align: 'left',
  width: 'min',
  emptyChar: ' ',
  rightPad: 0,
  leftPad: 0,
}
const formats = {

  reset: "\x1b[0m\x1b[40m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  red: "\x1b[31m",
  green: "\x1b[32m",
  black: "\x1b[30m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",

}

const manageStyle = (styles, item) => {
  const [_,...split] = item.split(' ');
  for (const style of split) {
    const keyValue = style.split(':');
    if (keyValue.length) {
      const [key, stringValue] = keyValue;
      let value = stringValue;
      if ((key === 'leftPad' && key === 'rightPad' || key === 'width') && stringValue !== 'max' && stringValue !== 'min') {
        value = Number(stringValue);
      }
      styles[key] = value;
    }
  }
  return styles;
}

const buildEmptySpace = (length, char) => (Array.from(Array(Number(length ?? 0)).keys())).map(() => ('')).join(char);

const getStringValue = (value, styles) => {

  const {
    width: widthOption,
    emptyChar,
    align,
    leftPad,
    rightPad
  } = styles;

  let width = widthOption === 'max' ? getScreenWidth() : widthOption;

  const leftSpacePad = buildEmptySpace(leftPad, ' ');
  const rightSpacePad = buildEmptySpace(rightPad, ' ');

  let string = `${leftSpacePad}${value}${rightSpacePad}`;
  if (typeof width === 'number') {
    if (width < 1) {
      width = Math.round(getScreenWidth() * width);
    }
    const charWidth = string.length;
    const emptySpace = width - charWidth;
    if (emptySpace < 0) {
      const index = Math.max(0, string.length + emptySpace - 3);
      string = string.slice(0, index) + '..';
    } else {

      if (align === 'left') {
        const space = buildEmptySpace(emptySpace, emptyChar);
        string = `${string}${space}`;

      } else if (align === 'right') {
        const space = buildEmptySpace(emptySpace, emptyChar);
        string = `${space}${string}`;

      } else if (align === 'center') {
        const halfSpace = emptySpace / 2;
        const leftCount = Math.ceil(halfSpace);
        const rightCount = Math.floor(halfSpace);
        const leftSpace = buildEmptySpace(leftCount, emptyChar);
        const rightSpace = buildEmptySpace(rightCount, emptyChar);
        string = `${leftSpace}${string}${rightSpace}`;
      }
    }


  }

  return string;
  

}

const print = (string) => {

  let styles = { ...defaults };
  let format = `${formats.reset}${formats.white}`;
  let current = '';

  const lines = string.split('\n');

  for (const line of lines) {

    const item = line.trim();

    if (item.startsWith('*reset')) {
      styles = { ...defaults };
      format = formats.reset;
    }

    else if (item.startsWith('layout')) {
      styles = manageStyle(styles, item);
    }

    else if (item.startsWith('style')) {
      const [_, ...rest] = item.split(' ');
      format += rest.map((key) => (formats[key])).join('');
    }

    else if (item.startsWith('text "')) {
      const value = item.replace('text "', '').replace('"', '');
      current += `${format}${getStringValue(value, styles)}`;
    }

    else if (item.startsWith('nl')) {
      current += '\n';
    }

  }

  if (current.endsWith('\n')) {
    process.stdout.write(current);
  } else {
    process.stdout.write(`${current}\n`);
  }
  process.stdout.write(formats.reset);
}

module.exports = {
  buildEmptySpace,
  getScreenWidth,
  print,
  formats
};