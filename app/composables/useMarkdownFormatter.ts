// Round-trips markdown through remark to normalize formatting:
//   - bullets: '-' (consistent across nested lists)
//   - emphasis: '_', strong: '*'
//   - fenced code blocks (no indented variants)
//   - blank lines around blocks
//   - one-space list indentation
//   - GFM extensions (tables, strikethrough, task lists) preserved
//
// Pre-pass: humans often type `-item` without the space CommonMark
// requires. Remark would parse those as paragraph text, not a list, so
// repair them before parsing. We only repair when 2+ consecutive lines
// look like the broken pattern, to avoid mangling things like a
// single line starting with `*emphasis*`.
//
// Remark is loaded lazily so the ~50KB bundle only ships when the user
// actually clicks the Format button.

function repairListMarkers(input: string): string {
  const lines = input.split(/\r?\n/)
  const broken = /^[-*+]\S/
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    let j = i
    while (j < lines.length && broken.test(lines[j])) j++
    if (j - i >= 2) {
      for (let k = i; k < j; k++) {
        out.push(lines[k].replace(/^([-*+])/, '$1 '))
      }
      i = j
    }
    else {
      out.push(lines[i])
      i++
    }
  }
  return out.join('\n')
}

export function useMarkdownFormatter() {
  const formatting = ref(false)

  async function format(input: string): Promise<string> {
    if (formatting.value || !input.trim()) return input
    formatting.value = true
    try {
      const repaired = repairListMarkers(input)
      const [{ remark }, { default: remarkGfm }] = await Promise.all([
        import('remark'),
        import('remark-gfm')
      ])
      const file = await remark()
        .use(remarkGfm)
        .data('settings', {
          bullet: '-',
          emphasis: '_',
          strong: '*',
          fence: '`',
          listItemIndent: 'one',
          rule: '-'
        })
        .process(repaired)
      // remark always emits a trailing newline; trim+restore so the
      // editor doesn't accumulate blank lines on repeated formatting.
      return String(file).trimEnd() + '\n'
    }
    finally {
      formatting.value = false
    }
  }

  return { format, formatting }
}
