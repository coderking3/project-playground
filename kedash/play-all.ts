//#region play.ts
import type { FlagSchema, PlayOptions } from './types'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function parseFlagValue(schema: FlagSchema, rawValue: any) {
  const { type } = schema

  if (!type) return rawValue

  if (typeof type === 'function') return type(rawValue)

  return rawValue
}

function getPlayOptions(options?: PlayOptions) {
  console.log(`🚀 ~ options:`, options)


}

// export function getSafeArgv(rawArgv = process.argv) {
//   const userArgs = rawArgv.slice(2)
//   const safeArgs = [...userArgs]

//   userArgs.forEach((arg) => {
//     console.log(`🚀 ~ arg:`, arg)
//   })

//   const needsDash = safeArgs.some((arg) => NODE_RESERVED_ARGS.includes(arg))
//   if (needsDash && !safeArgs.includes('--')) {
//     safeArgs.unshift('--')
//   }

//   return safeArgs
// }



// parseArgs

// process

function play() {
  const options = getPlayOptions({
    name: 'play',
    version: '1.0.0',
    flags: {
      verbose: {
        type: Boolean,
        alias: 'v',
        default: false,
        description: 'Enable verbose output'
      },

      port: {
        type: (v) => Number(v),
        alias: 'p',
        default: 3000,
        description: 'Port number',
        parameter: '<value>' // ✅ 现在应该可以了
      },

      config: {
        type: String,
        alias: 'c',
        description: 'Config file path',
        parameter: '[value]' // ✅ 可选参数
      }
    }
  })
}

play()

/* 
  知识点考究
    fileURLToPath 
      将 file:// 协议的 URL 转换为系统绝对路径字符串。
        示例：
          console.log(fileURLToPath('file://king3/download/test.js'))
          // D://king3/download/test.js
    resolve 
      从左到右解析一组路径或路径片段，返回标准化的绝对路径。
        从右往左扫描参数，直到遇到第一个绝对路径；
        如果没有绝对路径，则从 process.cwd()（当前工作目录）开始。
    dirname 
      从完整路径中提取出目录部分。
        示例：
          console.log(dirname('/Users/king/project/src/index.js'))
          // /Users/king/project/src
    new URL
      根据基准 URL（第二个参数）去解析第一个相对路径。
      遵循 URL 标准（RFC）的路径解析规则
      console.log(new URL('./temp','file://king3/download/test.js'))
        // /test.js 会被当成一个文件而不是目录 会在父级目录拼接temp
        // file://king3/download/temp
*/

//#endregion


//#region types.ts
export type FlagType<ReturnType = any> = (value: any) => ReturnType

export type FlagParameter = `<${string}>` | `[${string}]`
export interface FlagSchema<T = any> {
  type: FlagType<T>
  alias?: string
  default?: T
  description?: string
  parameter?: FlagParameter // 改为 string，可以是任何参数描述
}

export interface Flags {
  [flagName: string]: FlagSchema
}

export interface PlayOptions {
  name?: string
  version?: string
  flags?: Flags
}

//#endregion


//#region dev.js
/* eslint-disable no-console */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// ESM 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 获取可用文件列表
function getAvailableFiles() {
  const playgroundDir = path.resolve(__dirname, '../playground')
  if (!fs.existsSync(playgroundDir)) {
    return []
  }

  return fs
    .readdirSync(playgroundDir)
    .filter((f) => f.endsWith('.ts'))
    .map((f) => ({
      name: f.replace('.ts', ''),
      path: path.join(playgroundDir, f)
    }))
}

// 运行文件
function runFile(filePath, options = {}) {
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)
    process.exit(1)
  }

  // 构建 tsx 命令
  const tsxCommand = []

  if (options.watch) {
    tsxCommand.push('watch')
  }

  // 默认使用根目录的 tsconfig.json
  const tsconfigPath = path.resolve(__dirname, '../tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    tsxCommand.push('--tsconfig', tsconfigPath)
  }

  // 最后是文件路径
  tsxCommand.push(filePath)

  // 显示执行信息
  console.log(`\n✅ 运行: ${path.relative(process.cwd(), filePath)}`)
  if (options.watch) {
    console.log(`👀 监听模式已启用`)
  }
  console.log('')

  // 跨平台的 spawn 配置
  const spawnOptions = {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  }

  // Windows 需要 shell: true
  if (process.platform === 'win32') {
    spawnOptions.shell = true
  }

  // 执行 tsx
  const child = spawn('tsx', tsxCommand, spawnOptions)

  child.on('error', (err) => {
    console.error('\n❌ 执行失败:', err.message)
    if (err.message.includes('ENOENT')) {
      console.log('\n💡 请先安装 tsx: pnpm add -D tsx')
    }
    process.exit(1)
  })

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n⚠️  进程退出,代码: ${code}`)
    }
    process.exit(code || 0)
  })

  // 处理 Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n👋 退出...')
    child.kill('SIGINT')
    process.exit(0)
  })
}

function showSimpleHelp() {
  console.log(`
使用指南: pnpm dev [选项]

选项:
  -f, --file <name>     指定要运行的文件 (默认: index)
  -w, --watch           启用监听模式
  -l, --list            列出所有可用文件
  -h, --help            显示帮助信息

示例:
  pnpm dev -f other
  pnpm dev --file other --watch
  pnpm dev -l                        # 列出所有文件

说明:
  - 自动使用根目录的 tsconfig.json 配置
  - 文件从 playground 目录读取
  
平台支持:
  ✅ macOS
  ✅ Linux
  ✅ Windows
  `)
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const options = {
    file: null,
    watch: false
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]

    if (arg === '-f' || arg === '--file') {
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        options.file = args[i + 1]
        i += 2
        continue
      }
    } else if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1]
      i++
      continue
    } else if (arg === '--watch' || arg === '-w') {
      options.watch = true
      i++
      continue
    } else if (arg === '-h' || arg === '--help') {
      showSimpleHelp()
      process.exit(0)
    } else if (arg === '-l' || arg === '--list') {
      const files = getAvailableFiles()
      if (files.length === 0) {
        console.log('❌ playground 目录中没有找到 .ts 文件')
      } else {
        console.log('\n📁 可用文件:\n')
        files.forEach((f, index) => console.log(`  ${index + 1}. ${f.name}`))
        console.log('')
      }
      process.exit(0)
    }

    i++
  }

  // 默认文件
  if (!options.file) {
    options.file = 'index'
  }

  // 构建文件路径
  let filePath = options.file
  if (!filePath.includes('\\') && !filePath.endsWith('.ts')) {
    filePath = path.resolve(__dirname, '../playground', `${filePath}.ts`)
  } else {
    filePath = path.resolve(__dirname, '..', filePath)
  }

  // 检查文件
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`)

    const files = getAvailableFiles()
    if (files.length > 0) {
      console.log('\n📁 可用文件:')
      files.forEach((f) => console.log(`  - ${f.name}`))
    }

    console.log('\n💡 提示: 使用 -h 查看帮助')
    process.exit(1)
  }

  runFile(filePath, options)
}

main()

//#endregion


//#region play-js.js
/* eslint-disable no-console */
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
// import { parseArgs } from 'node:util'

// ESM 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// const playgroundDir = resolve(__dirname, '../playground')
// console.log(`🚀 ~ playgroundDir:`, playgroundDir)

// console.log('pg dir', readdirSync(playgroundDir))

// const argv = [...process.argv].slice(2)
// console.log(`🚀 ~ argv:`, argv)

// const NODE_RESERVED_ARGS = ['--watch']

// export function getSafeArgv(rawArgv = process.argv) {
//   const userArgs = rawArgv.slice(2)
//   const safeArgs = [...userArgs]

//   userArgs.forEach((arg) => {
//     console.log(`🚀 ~ arg:`, arg)
//   })

//   const needsDash = safeArgs.some((arg) => NODE_RESERVED_ARGS.includes(arg))
//   if (needsDash && !safeArgs.includes('--')) {
//     safeArgs.unshift('--')
//   }

//   return safeArgs
// }

// // flags

// function getPlayOptions() {}

// const options = getPlayOptions()

const args = parseArgs({
  allowPositionals: true,
  options: {
    file: {
      type: 'string',
      short: 'f',
      default: 'index'
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  }
})
console.log(`🚀 ~ args:`, args)
// console.log(`🚀 ~ args:`, args)

// function findProjectRoot(dir = __dirname) {
//   let currentDir = dir
//   while (currentDir !== '/') {
//     if (existsSync(resolve(currentDir, 'package.json'))) {
//       return currentDir
//     }
//     currentDir = dirname(currentDir)
//   }
//   return process.cwd() // fallback
// }

// const rootDir = findProjectRoot()
// console.log('Project Root:', rootDir)

//#endregion


//#region play-ts.ts
/* eslint-disable no-console */
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// import { parseArgs } from 'node:util'

import { parseArgs } from 'node:util'
import { cli } from 'cleye'

cli({})

// ESM 中获取 __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const playgroundDir = resolve(__dirname, '../playground')
console.log(`🚀 ~ playgroundDir:`, playgroundDir)

console.log('pg dir', readdirSync(playgroundDir))

// const argv = [...process.argv].slice(2)
// console.log(`🚀 ~ argv:`, argv)

const NODE_RESERVED_ARGS = ['--watch']

export function getSafeArgv(rawArgv = process.argv) {
  const userArgs = rawArgv.slice(2)
  const safeArgs = [...userArgs]

  userArgs.forEach((arg) => {
    console.log(`🚀 ~ arg:`, arg)
  })

  const needsDash = safeArgs.some((arg) => NODE_RESERVED_ARGS.includes(arg))
  if (needsDash && !safeArgs.includes('--')) {
    safeArgs.unshift('--')
  }

  return safeArgs
}

type FlagType<ReturnType = any> = (value: any) => ReturnType
interface FlagSchema {
  type: FlagType
  alias?: string
  default?: any
  description?: string
}
interface Flags {
  [flagName: string]: FlagSchema
}

interface PlayOptions {
  /**
    Name of the script displayed in `--help` output.
    */
  name?: string
  /**
    Version of the script displayed in `--version` and `--help` outputs.
    */
  version?: string
  /**
    Flags accepted by the script
    */
  flags?: Flags
}

function getPlayOptions(options?: PlayOptions) {
  console.log(`🚀 ~ options:`, options)
}

const options = getPlayOptions({
  name: 'play',
  version: '1.0.0',
  flags: {
    file: {
      type: Boolean,
      alias: 'f',
      default: true
    }
  }
})

/* 
import { Command } from 'commander';
const program = new Command();

program
  .version('1.0.0')
  .option('-p, --port <number>', 'set port number', 3000)
  .option('-m, --mode <mode>', 'set mode', 'dev')
  .parse(process.argv);
*/

const args = parseArgs({
  allowPositionals: true,
  options: {
    file: {
      type: 'string',
      short: 'f',
      default: 'index'
    },
    help: {
      type: 'boolean',
      short: 'h',
      default: false
    }
  }
})
console.log(`🚀 ~ args:`, args)
// console.log(`🚀 ~ args:`, args)

// function findProjectRoot(dir = __dirname) {
//   let currentDir = dir
//   while (currentDir !== '/') {
//     if (existsSync(resolve(currentDir, 'package.json'))) {
//       return currentDir
//     }
//     currentDir = dirname(currentDir)
//   }
//   return process.cwd() // fallback
// }

// const rootDir = findProjectRoot()
// console.log('Project Root:', rootDir)

//#endregion
