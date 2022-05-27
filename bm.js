require('./config');
const fs = require('fs');
const { print: printV2 } = require('simple-node-ui');
const { format, formatDistanceToNow, differenceInDays } = require('date-fns');
const prompt = require("prompt-sync")({ sigint: true });
const { print, formats, getScreenWidth } = require('./node-ui');
const { read, write } = require('./fs-utils');
const { exec } = require('child_process');
const path = process.cwd();
const rootSettings = `${process.env.HOME}/bm/settings.json`
global._settings = read(rootSettings, {});
global._root = process.env.HOME;

const initBm = () => {
  if (!(path in _settings)) {
    print(`
      layout width:max align:center
      style bgGreen bright white
      text "Initializing..."
      nl
      layout width:.2 align:right
      style reset cyan
      text "Path"

      layout width:.8 align:left leftPad:2
      style reset
      text "${path}"
      nl
      nl
      nl
    `);
    const defaultBranch = prompt('Default Branch: (main) ') || 'main';

    _settings[path] = { defaultBranch };
    write(rootSettings, _settings);
  } else {
    print(`
      style cyan
      text "${path} "
      style reset
      text "has already been set up."
      nl
      nl
      text "Use "
      style green
      text "bm settings"
      style reset
      text " to view settings.
      nl
      text "Or use "
      style green
      text "bm settings -e"
      style reset
      text " to edit settings."
      nl
      nl
    `)
  }

}

const handleObjectSettings = (key, value, step) => {
  const newEntries = Object.entries(value);
  const emptyString = newEntries.length ? '' : `
    layout leftPad:2 align:left
    style reset magenta
    text "empty"
  `;
  const width = 20 + (step * 2);
  print(`
    layout width:${width} align:right
    style ${stepColors[step]}
    text "${key}|"
    ${emptyString}
  `);
  if (newEntries.length) {
    settings(newEntries, step + 1);
  }
}

const stepColors = ['cyan', 'green', 'yellow', 'blue']

const settings = async (entries = null, step = 0) => {
  try {

    if (entries === null) {
      const currentBranch = await getCurrentBranch();
      console.log();
      if (_settings[path].defaultBranch === currentBranch) {
        printV2(`"Settings for "<style:bgBlue,white>"${path}"<nl>`)
        entries = Object.entries(_settings[path]);
      } else {
        entries = Object.entries(_settings[path].branches[currentBranch]);
      }
    }

    entries.forEach(([key, value]) => {
      if (typeof value === 'object') {
        handleObjectSettings(key, value, step);
      } else {
        const width = 20 + (step * 2);
        const remain = getScreenWidth() - width;
        if (key === 'createdAt' || key === 'lastTouch') {
          value = format(new Date(value), 'MMM d, yyyy h:mm a');
        }
        if (key === 'createdAt') {
          const distance = formatDistanceToNow(new Date(value));
          print(`
          layout width:${width} align:right
          style ${stepColors[step]}
          text "duration|"
          layout leftPad:2 align:left width:${remain}
          style reset
          text "${distance}"
        `);
        }
        print(`
          layout width:${width} align:right
          style ${stepColors[step]}
          text "${key}|"
          layout leftPad:2 align:left width:${remain}
          style reset
          text "${value}"
        `);
      }
    });
    if (step === 0) console.log();
  } catch (err) {
    console.log(err);
  }
}

const listRepos = () => {

  const list = Object.entries(_settings).sort(([a], [b]) => (a.localeCompare(b)));

  if (_args[1] === 'rm' && _args[2] && /^\d+$/.test(_args[2])) {
    const index = Math.min(list.length - 1, _args[2]);
    printV2(`"Removed "  <style:bgBlue,white>  "${list[index][0]}"`);
    delete _settings[list[index][0]];
    write(rootSettings, _settings);
  } if (_args[1] && /^\d+$/.test(_args[1])) {
    const index = Math.min(list.length - 1, _args[1]);
    return list[index][0];
  } if (_args[1]) {
    const path = list.find(([key]) => key.includes(_args[1]));
    if (path) {
      return path[0];
    }

  } else {
    console.log();
    list.forEach(([path, item], idx) => {
      const days = item.lastTouch
        ? Math.abs(differenceInDays(new Date(), new Date(item.lastTouch)))
        : 10;
      const existStyle = fs.existsSync(path)
        ? days > 7 ? 'yellow' : 'green'
        : 'red';
      const distance = item.lastTouch ? formatDistanceToNow(new Date(item.lastTouch)) : '';
      printV2(`
        <width:5 rightSpace:2>
        "${idx}."
        <width:.6 rightSpace:0 style:${existStyle}>
        "${path.replace(process.env.HOME, '~')}"
        <leftSpace:4 style:reset,cyan leftSpace:2>
        "${distance}"
      `);
    });
  }
}

const hasRemoteBranch = async (branch = '') => {
  const currentBranch = branch || await getCurrentBranch();
  try {
    await execCmd(`git show-branch remotes/origin/${currentBranch}`);
    return true;
  } catch (err) {
    return false;
  }
}

const getCurrentBranch = async () => {
  const currentBranch = await execCmd(`git branch --show-current`);
  return currentBranch.trim();
}

const createNewBranch = async () => {
  if (_args[1]) {
    try {
      const currentBranch = await getCurrentBranch();
      const hasRemote = await hasRemoteBranch(currentBranch);
      if (hasRemote) {
        await execCmd(`git pull origin ${currentBranch}`);
      }
      await execCmd(`git branch ${_args[1]}`);
      _settings[path] = {
        ..._settings[path],
        branches: {
          ...(_settings[path]?.branches ?? {}),
          [_args[1]]: {
            parent: currentBranch,
            createdAt: new Date().toISOString()
          }
        }
      }
      write(rootSettings, _settings);
      await execCmd(`git checkout ${_args[1]}`);
    } catch (err) {
      console.log(err);
    }

  } else {
    print(`
      nl
      text "You need to specify a branch name."
      nl
      style green
      text "bm n "
      style reset
      text "branch"
      nl
      nl
      nl
    `);
  }
}

const execCmd = async (cmd) => {
  if (cmd.includes('checkout')) {
    const currentBranch = await getCurrentBranch();
    if (_settings[path].lastBranch !== currentBranch) {
      _settings[path].lastBranch = currentBranch;
    }
    write(rootSettings, _settings);
  }
  if (_flags.GIT_CMDS) console.log(cmd);
  return new Promise((res, rej) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return rej(stderr);
      }
      if (_flags.GIT_CMDS) console.log(stdout);
      res(stdout);
    });
  });
}

const writeStatusDetail = (title, data, style) => {
  const list = data.filter((item) => (!!item));
  if (list.length) {
    print(`
      layout leftPad:2 rightPad:2
      style ${style} bright
      text "${title}"
    `);
    list.forEach((item) => {
      const value = _flags.VERBOSE
        ? item : item.split('/').at(-1);
      console.log('  •', value);
    })
    console.log();
  }
}

const status = async () => {
  const currentBranch = await getCurrentBranch();
  const parentBranch = getParentBranch(currentBranch);

  const cmd = currentBranch === _settings[path].defaultBranch
    ? `git diff --stat | tail -n1`
    : `git diff ${parentBranch}...${currentBranch} --stat | tail -n1`;

  const overview = await execCmd(cmd);
  printV2(`
    <nl width:max align:center style:bgGreen,black>
    "${overview || 'No changes detected.'}"
    <nl:2>
  `);

  const deleted = (await execCmd(`git ls-files -d`)).split('\n');
  const modifiedRaw = (await execCmd(`git ls-files -m`)).split('\n');
  const modified = modifiedRaw.filter((item) => (!deleted.includes(item)));
  const untracked = (await execCmd(`git ls-files --others --exclude-standard`)).split('\n');

  writeStatusDetail('Modified', modified, `bgMagenta white`);
  writeStatusDetail('Deleted', deleted, `bgRed white`);
  writeStatusDetail('Untracked', untracked, `bgBlack white`);

}

const getParentBranch = (currentBranch) => _settings?.[path]?.branches?.[currentBranch]?.parent ?? '';

const prune = async () => {
  await execCmd(`git fetch -p`);
  const data = await execCmd(`git for-each-ref --format='%(refname:short)' refs/heads/`);
  const branches = data.split('\n').filter((item) => (!!item));
  const current = Object.keys(_settings?.[path]?.branches);
  const filter = current.filter((item) => (!branches.includes(item)));
  for (const item of filter) {
    _settings[path].branches[item] = current[item];
  }
  write(rootSettings, _settings);
}

const deleteBranch = async () => {
  try {
    const defaultBranch = _settings[path].defaultBranch;
    const currentBranch = await getCurrentBranch();
    const parentBranch = getParentBranch(currentBranch);
    if (defaultBranch !== currentBranch) {
      if (parentBranch && _args.length === 1) {
        await execCmd(`git checkout ${parentBranch}`);
        _settings[path].lastBranch = parentBranch;
        await execCmd(`git branch -D ${currentBranch}`);
        delete _settings?.[path]?.branches?.[currentBranch];
        write(rootSettings, _settings);
      } else {
        console.log(`Can't return to parent branch from here. Use bm d {branch} to delete.`);
      }
      await execCmd(`git fetch -p`);
    } else {
      if (_args[1]) {
        console.log(_args[1]);
        await execCmd(`git branch -D ${_args[1]}`);
      } else {
        console.log();
        console.log(`Couldn't delete the default branch -> ${defaultBranch}`);
        console.log();
      }
    }
  } catch (err) {
    console.log(err);
  }
}

const push = async () => {
  try {
    const hasRemote = await hasRemoteBranch();
    const currentBranch = await getCurrentBranch();
    if (hasRemote) {
      await execCmd(`git push`);
    } else {
      if (_flags.SET_UPSTREAM) {
        execCmd(`git push --set-upstream origin ${currentBranch}`);
      } else {
        console.log();
        console.log(`  Use bm p < -su | --set-upstream > to set upstream.`)
        console.log();
      }
    }
  } catch (err) {
    console.log(err);
  }
}

const AddCommitPush = async (des = '') => {
  try {
    if (_args.length > 0 || des) {
      const description = des || _args.slice(1).join(' ');
      await execCmd(`git add .`);
      await execCmd(`git commit -m "${description}"`);
      await push();
      print(`
        nl
        layout width:20 align:right rightPad:2
        style bright cyan
        text "Description"
        layout width:40 align:left leftPad:2
        style reset
        text "${description}"
        nl
        nl
      `)
    } else {
      console.log('You need to add a description.');
    }

  } catch (err) {
    console.log(err);
  }
}

const remote = async () => {
  try {
    const currentBranch = await getCurrentBranch();
    const hasRemote = await hasRemoteBranch(currentBranch);
    if (hasRemote) {
      const base = (await execCmd(`git config remote.origin.url | cut -f2 -d. | tr ':' /`)).trim();
      await execCmd(`open https://github.${base}/tree/${currentBranch}`);
    } else {
      console.log();
      console.log(`There isn't any remote branch.`);
      console.log();
    }
  } catch (err) {
    console.log(err);
  }
}

const update = async () => {

  try {

    let branch = _settings[path]?.defaultBranch;
    const currentBranch = await getCurrentBranch();
    if (!_flags.SELF) {
      if (currentBranch !== branch) {
        branch = getParentBranch(currentBranch);
        if (!branch) {
          console.log(`Can't seem to detect a parent branch.`);
          return;
        }
      }
    } else {
      branch = currentBranch;
    }

    await execCmd(`git checkout ${branch}`);
    await execCmd(`git pull origin ${branch}`);
    if (!_flags.SELF) {
      await execCmd(`git checkout ${currentBranch}`);
      await execCmd(`git merge ${branch}`);
    }

  } catch (err) {
    console.log(err);
  }

}

const clearBranch = async () => {
  try {
    await execCmd(`git add .`);
    await execCmd(`git stash`);
  } catch (err) {
    console.log(err);
  }
}

const listBranches = async (index = null) => {
  if (!_flags.CACHE) {
    const data = await execCmd(`git for-each-ref --format='%(refname:short)' refs/heads/`);
    const branches = data.split('\n').filter((item) => (!!item))
    const currentBranch = await getCurrentBranch();
    if (index === null) {
      console.log();
      branches.forEach((item, idx) => {
        const style = item.trim() === currentBranch ? `style reset bgGreen` : `style reset`;
        print(`
          layout width:max leftPad:4 rightPad:4
          ${style}
          text "${idx}. ${item}"
        `);

      });
      console.log();
    } else {
      return branches[index].trim();
    }
  } else {
    const list = Object.entries(_settings?.[path]?.branches);
    if (!list.length) {
      console.log();
      console.log('   ', `Nada. You're good to go`);
      console.log();
    }
    list.forEach(([key, value]) => {
      print(`
        nl
        layout width:.25 align:right rightPad:2
        style bright cyan
        text "${key}"
        layout width:.25 align:left
        style reset
        text "${value.parent}"
        nl
        nl
      `)
    });
  }
}

const checkoutBranch = async (branch = _args[1]) => {
  if (/^\d+$/.test(branch)) {
    branch = await listBranches(branch);
  }
  try {
    if (branch) {
      await execCmd(`git checkout ${branch}`);
    } else {
      const defaultBranch = _settings[path]?.defaultBranch;
      await execCmd(`git checkout ${defaultBranch}`);
    }
  } catch (err) {
    console.log(err);
  }
}

const logCommits = async () => {

  const currentBranch = await getCurrentBranch();
  const parentBranch = getParentBranch(currentBranch);
  if (parentBranch) {
    try {
      console.log();
      const files = await execCmd(`git show --name-only --oneline ${parentBranch}..HEAD`);
      const split = files.split('\n');
      split.forEach((item) => {
        let style = formats.reset;
        if (item.includes(' ')) {
          console.log();
          style = formats.cyan;
        }
        console.log('  ', style, item, formats.reset);
      });
    } catch (err) {
      console.log(err);
    }

  } else {
    console.log(`Couldn't find the parent branch.`);
  }
}

const renameBranch = async () => {
  if (_args[1]) {
    const currentBranch = await getCurrentBranch();
    await execCmd(`git branch -m ${_args[1]}`);
    _settings[path].branches[_args[1]] = {
      ..._settings?.[path]?.branches?.[currentBranch],
      parent: _settings?.[path]?.branches?.[currentBranch]?.parent
    }
    delete _settings?.[path]?.branches?.[currentBranch];
    write(rootSettings, _settings);
    console.log();
    console.log('  ', `Renamed local branch: ${currentBranch} -> ${_args[1]}`);
    console.log();
    const hasRemote = await hasRemoteBranch();
    if (_flags.REMOTE && hasRemote) {
      if (hasRemote) {
        await execCmd(`git push origin -u ${_args[1]}`);
        console.log(`   Update remote branch: ${_args[1]}`);
      } else {
        console.log(`   This branch doesn't have a remote branch`);
      }
    } else if (hasRemote && !_flags.REMOTE) {
      console.log('   bm rn {newName} < --remote / -r > to update remote branch.');
    }
  } else {
    console.log('   Renaming a branch requires a {newName} arg. bm rn {newName}');
  }
  console.log();
}

const removeFile = async () => {

  if (_args[1]) {
    try {
      await execCmd(`git rm -r --cached ${_args[1]}`);
      await AddCommitPush(`Removed ${_args[1]}`);
    } catch (err) {
      console.log(err);
    }
  } else {
    printV2(`<nl leftSpace:4>"Missing file arg"<nl>`)
  }


}

const main = async () => {

  const cmd = _args[0];

  if (_flags.HELP) {
    help(_args[0]);
    return;
  }

  if (cmd === 'init') {
    initBm();
    return;
  } else if (cmd === 'pwd') {
    try {
      console.log(`${_root}/bm`);
    } catch (err) {
      console.log(err);
    }
    return;
  } else if (cmd === 'repos') {
    const value = listRepos();
    if (value) {
      console.log(`cd ${value}`);
    }
  } 

  if (!(path in _settings)) {
    print(`
      nl
      text "You have to use "
      style green
      text "bm init"
      style reset
      text " before you can use other commands."
      nl
      nl
      nl
    `);
    return;
  }

  if (cmd === 'settings') {
    settings();
  } else if (cmd === 'n' || cmd === 'new') {
    createNewBranch();
  } else if (cmd === 'rn' || cmd === 'rename') {
    renameBranch();
  } else if (cmd === 's' || cmd === 'status') {
    status();
  } else if (cmd === 'd' || cmd === 'delete') {
    deleteBranch();
  } else if (cmd === 'p' || cmd === 'push') {
    push();
  } else if (cmd === 'r' || cmd === 'remote') {
    remote();
  } else if (cmd === 'c' || cmd === 'clear') {
    clearBranch();
  } else if (cmd === 'co' || cmd === 'checkout') {
    checkoutBranch();
  } else if (cmd === 'co-' || cmd === 'checkout-') {
    checkoutBranch(_settings[path]?.lastBranch);
  } else if (cmd === 'rm' || cmd === 'remove') {
    removeFile();
  } else if (cmd === 'parent-branch') {
    const current = await getCurrentBranch();
    const parent = getParentBranch(current);
    console.log();
    console.log(parent || "Couldn't detect a parent branch.");
    console.log();
  } else if (cmd === 'u' || cmd === 'update') {
    update();
  } else if (cmd === 'l' || cmd === 'list') {
    listBranches();
  } else if (cmd === 'log') {
    logCommits();
  } else if (cmd === '.') {
    AddCommitPush();
  } else if (cmd === 'help') {
    help();
  } else if (cmd === 'prune') {
    prune();
  } else if (cmd === 'has-remote') {
    const hasRemote = await hasRemoteBranch();
    console.log(hasRemote);
  } else if (!cmd) {
    listBranches();
  }

  _settings[path].lastTouch = new Date().toISOString();
  write(rootSettings, _settings);

}

const help = (cmd = null) => {
  const emptyLeft = Math.ceil(getScreenWidth() * .33)
  console.log();
  if (cmd === null) {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "command"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "description"
      style reset
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{args}"
      style reset
      layout width:.7 align:left leftPad:7
      text "< flags >"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'n' || cmd === 'new') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "n | new"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git pull current branch (parent branch) / git branch {branch-name} / git checkout {branch-name}"
      nl
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{branch-name}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'rn' || cmd === 'rename') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "rn | rename"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git branch -m {newName} / (with -r flag) git push origin -u {newName}"
      style reset
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{newName}"
      style reset
      layout width:.7 align:left leftPad:7
      text "< --remote | -r > rename remote github branch"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 's' || cmd === 'status') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "s | status"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git status"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === '.') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "."
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git add . / git commit -m {description} / git push (if there is a remote github branch)"
      nl
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{description}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'c' || cmd === 'clear') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "c | clear"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Clears any uncommitted changes: git add . / git stash"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'd' || cmd === 'delete') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "d | delete"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Delete current branch or delete {branch} with optional arg."
      nl
      layout width:.3 align:right rightPad:2
      style reset dim
      text "optional: {branch}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'p' || cmd === 'push') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "p | push"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git push"
      style reset
      layout leftPad:${emptyLeft}
      text "< --set-upsteam | -su > set remote github branch"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'rm' || cmd === 'remove') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "rm | remove"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git rm -r --cached {filepath}"
      nl
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{filepath}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'r' || cmd === 'remote') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "r | remote"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Open remote github branch in browser"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'l' || cmd === 'list') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "l | list"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "List all branches with their associated number. (see git checkout)"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'co' || cmd === 'checkout') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "co | checkout"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git checkout {branch} / leaving {branch} empty will automaticaly checkout the default branch"
      nl
      layout width:.3 align:right rightPad:2
      style reset dim
      text "{branch-name | branch-number}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'co-' || cmd === 'checkout-') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "co- | checkout-"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git checkout {last-branch}"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'parent-branch') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "parent-branch"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Display parent branch."
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'u' || cmd === 'update') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "u | update"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Pulls parent branch / Merges parent branch"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'log') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "log"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git log (clean)"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'prune') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "prune"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "git fetch -p / Reconciles local settings"
      nl
      nl
    `);
  }
  if (cmd === null || cmd === 'has-remote') {
    print(`
      layout width:.3 align:right rightPad:2
      style reset
      text "has-remote"
      style bright cyan
      layout width:.7 align:left leftPad:2
      text "Return true/false if the current branch has a remote github branch"
      nl
      nl
    `);
  }
  if (cmd === null) {
    print(`
      nl
      nl
      layout leftPad:6
      style reset
      text "adding < --display-cmds > flag to any command will display the git commands being executed."
    `);
    print(`  
      layout leftPad:6
      style reset
      text "adding < --help > flag to any command will display the help instruction."
    `);
  }


  process.chdir(`/Users/crockettty/projects`)
  console.log();

}

main();

// } else if (cmd === 'help') {
//   help();
// } else if (cmd === 'has-remote') {
//   const hasRemote = await hasRemoteBranch();
//   console.log(hasRemote);
// }
