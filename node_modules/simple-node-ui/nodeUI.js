const numeral = require('numeral');

const getScreenWidth = () => process.stdout.columns;
const getScreenHeight = () => process.stdout.rows;

const defaults = {
  align: 'left',
  width: 'min',
  emptyChar: ' ',
  rightSpace: 0,
  leftSpace: 0,
  overflow: 'ellipsis',
}

const styles = {

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

const buildEmptySpace = (length, char) => (Array.from(Array(Number(length ?? 0)).keys())).map(() => ('')).join(char);

const buildStyleValues = (style) => {

  const split = style.slice(1, -1).split(/\n| /g);
  
  let colorString = '';
  let updateStyle = {};
  split.forEach((item) => {

    if (item.startsWith('style:')) {
      const [_, value] = item.split(':');
      const splitValues = value.split(',');
      colorString = splitValues.reduce((prev, formatKey) => {
        return prev + styles[formatKey]
      }, colorString);
    } else if (item.startsWith('nl:')) {
      const [_, value] = item.split(':');
      if (!isNaN(Number(value))) {
        let space = Number(value);
        if (space < 1) {
          space = Math.ceil(getScreenHeight() * space);
        }
        colorString += buildEmptySpace(space + 1, "\n");
      }
    } else if (item === 'nl') {
      colorString += "\n";
    } else if (!!item) {
      const [key, value] = item.split(':');
      updateStyle[key] = value;
    }

  });

  return [
    colorString,
    updateStyle
  ]


}

const getSpaceValue = (space, strLength) => {

  const numberCheck = !isNaN(Number(space));

  if (numberCheck) {
    const spaceValue = Number(space);
    if (spaceValue < 1) {
      return Math.ceil(getScreenWidth() * spaceValue);
    } else {
      return spaceValue;
    }
  } else if (space === 'min') {
    return strLength + 1;
  } else if (space === 'max') {
    return getScreenWidth();
  }

}

const buildString = (string, style) => {

  const stringLength = string.length + 1;
  const width = getSpaceValue(style.width, stringLength);

  const leftSpace = style.leftSpace > 0 ? getSpaceValue(style.leftSpace, 0) + 1 : 0;
  const rightSpace = style.rightSpace > 0 ? getSpaceValue(style.rightSpace, 0) + 1 : 0;
  const builtLeftSpace = buildEmptySpace(leftSpace, style.emptyChar);
  const builtRightSpace = buildEmptySpace(rightSpace, style.emptyChar);
  
  let stringValue = `${builtLeftSpace}${string}${builtRightSpace}`;
  
  if (stringValue.length > width && style.width !== 'min' && style.width !== 'max') {

    const remaining = width - stringLength;
    if (remaining > 0) {
      const totalSpace = rightSpace + leftSpace;
      const right = Math.floor(rightSpace / totalSpace * remaining);
      const left = Math.ceil(leftSpace / totalSpace * remaining);
      const builtLeftSpace = buildEmptySpace(left, style.emptyChar);
      const builtRightSpace = buildEmptySpace(right, style.emptyChar);
      stringValue = `${builtRightSpace}${string}${builtLeftSpace}`;
    } else {
      const left = leftSpace > 0 ? style.emptyChar : "";
      const right = rightSpace > 0 ? style.emptyChar : "";
      stringValue = `${left}${string.slice(0, width - 3 - left.length - right.length)}...${right}`;
    }

  }

  if (stringValue.length < width) {
    if (style.align === 'left') {
      const remaining = width - stringValue.length;
      const space = buildEmptySpace(remaining, style.emptyChar);
      stringValue = `${stringValue}${space}`;
    } else if (style.align === 'right') {
      const remaining = width - stringValue.length;
      const space = buildEmptySpace(remaining, style.emptyChar);
      stringValue = `${space}${stringValue}`;
    } else if (style.align === 'center') {
      const remaining = (width - stringValue.length) / 2;
      const leftSpace = buildEmptySpace(Math.floor(remaining), style.emptyChar);
      const rightSpace = buildEmptySpace(Math.ceil(remaining), style.emptyChar);
      stringValue = `${leftSpace}${stringValue}${rightSpace}`;
    }
  }

  return stringValue;

}

const print = (string) => {

  let style = defaults;

  let stringValue = string.replaceAll('\n', '');
  const values = stringValue.match(/\<.*?\>|\".*?\"/g);

  const reconstruct = values.reduce((prev, item) => {

    if (item.startsWith('<') && item.endsWith('>')) {
      const [colorString, updateStyle] = buildStyleValues(item);
      style = { ...style, ...updateStyle };
      return prev + colorString;
    }

    if (item.startsWith('"') && item.endsWith('"')) {

      const clean = item.slice(1, -1);
      const string = buildString(clean, style);
      return prev + string;
    }

  }, '');

  console.log(`${reconstruct}${styles.reset}`);

}

const progressBar = (value, max, options = {}) => {

  const { charWidth = 'max', charComplete = '*', charIncomplete = '_' } = options;

  const width = getSpaceValue(charWidth, max);
  const units = width / max;
  const progress = Math.ceil(value * units);
  const remaining = Math.floor((max - value) * units);
  const left = buildEmptySpace(progress, charComplete);
  const right = buildEmptySpace(remaining, charIncomplete);
  console.log(`${left}${right}`);

}

const percent = (value) => {
  try {
    return numeral(value).format('0,0.00%');
  } catch {
    return value;
  }
};

module.exports = {
  styles,
  print,
  progressBar,
  buildEmptySpace,
  getScreenWidth,
  getScreenHeight,
  percent
}