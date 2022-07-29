
global._args = process.argv.slice(2);

const flagCheck = (..._flags) => {
  const hasFlags = _flags.some((flag) => _args.includes(flag));
  _args = _args.filter((item) => (!_flags.includes(item)));
  return hasFlags;
}

global._flags = {
  FORCE: flagCheck('--force', '-f'),
  REMOTE: flagCheck('--remote', '-r'),
  SET_UPSTREAM: flagCheck('--set-upstream', '-su'),
  VERBOSE: flagCheck('--verbose', '-v'),
  GIT_CMDS: flagCheck('--display-cmds'),
  SELF: flagCheck('--self'),
  HELP: flagCheck('--help'),
  CACHE: flagCheck('--cache'),
  HISTORY: flagCheck('--history'),
  STASH: flagCheck('--stash'),
}
