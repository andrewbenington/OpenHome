const StandardizeStringPattern = /[^a-zA-Z0-9]/g

function standardizeString(str: string): string {
  // return str
  return str.replace(StandardizeStringPattern, '').toUpperCase()
}

// First list options that start with the input, then options containing a word
// that starts with the input
export function filterOptions<Option>(
  input: string,
  options: readonly Option[],
  optionToString: (opt: Option) => string
) {
  const startMatch: Option[] = []
  const wordMatch: Option[] = []
  const spaceInInput = input.includes(' ')
  const stdizedInput = standardizeString(input)

  for (const opt of options) {
    const optionStr = optionToString(opt)

    if (!optionStr) continue

    const stdizedOptionStr = standardizeString(optionStr)
    if (stdizedOptionStr.startsWith(stdizedInput)) {
      startMatch.push(opt)
    } else if (
      !spaceInInput &&
      stdizedOptionStr.includes(stdizedInput)
      // optionStr
      //   .split(/[^\w]/)
      //   .map(standardizeString)
      //   .some((segment) => segment.startsWith(stdizedInput))
    ) {
      wordMatch.push(opt)
    }
  }

  return startMatch.concat(wordMatch)
}

export function getFilteredOptions<Option>(
  input: string,
  options: readonly Option[],
  getOptionString: (opt: Option) => string
): readonly Option[] {
  return input ? filterOptions(input, options, getOptionString) : options
}
