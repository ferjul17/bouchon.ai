import { execa } from 'execa'

async function main() {
  console.log('Running pre-commit hook: Formatting files...')
  const { exitCode, stderr, stdout } = await execa('pnpm', ['run', 'format'], { reject: false })

  if (stdout) {
    console.log(stdout)
  }
  if (stderr) {
    console.error(stderr)
  }

  if (exitCode !== 0) {
    console.error('Pre-commit hook failed: Formatting issues found. Aborting commit.')
    process.exit(1)
  } else {
    console.log('Pre-commit hook passed: Files formatted.')
    process.exit(0)
  }
}

main()
