import { execa } from 'execa'

async function runCommand(command: string, args: string[]) {
  console.log(`Running: ${command} ${args.join(' ')}`)
  const { exitCode, stderr, stdout } = await execa(command, args, { reject: false })

  if (stdout) {
    console.log(stdout)
  }
  if (stderr) {
    console.error(stderr)
  }

  return exitCode
}

async function main() {
  const commands = [
    { command: 'pnpm', args: ['run', 'lint'] },
    { command: 'pnpm', args: ['run', 'format', '--check'] },
    { command: 'pnpm', args: ['run', 'build'] },
    { command: 'pnpm', args: ['--filter', '@test-ai/backend', 'test:coverage'] },
  ]

  const results = await Promise.all(commands.map(cmd => runCommand(cmd.command, cmd.args)))

  const failed = results.some(exitCode => exitCode !== 0)

  if (failed) {
    console.error('Pre-push hook failed. Aborting push.')
    process.exit(1)
  } else {
    console.log('Pre-push hook passed. Proceeding with push.')
    process.exit(0)
  }
}

main()
