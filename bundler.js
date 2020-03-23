const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser') // 生成抽象语法树
const { default: traverse } = require('@babel/traverse') // 抽象语法树分析
const { transformFromAst } = require('@babel/core') // 将抽象语法树转化成代码

/**
 * 通过路径读取文件并解析
 * @param {String} filePath 
 * @return {Object} 解析结果
 */
const analyze = function (filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const ast = parser.parse(content, { sourceType: 'module' })
    const dependencies = [] 
    const { code } = transformFromAst(ast, null, {
        presets: ['@babel/env']
    })
    traverse(ast, {
        // 分析依赖的钩子
        ImportDeclaration ({ node }) {
            dependencies.push(node.source.value) // 获得所有依赖
        }
    })
    return {
        filePath,
        dependencies,
        code
    }
}

/**
 * 通过入口文件递归解析依赖，并返回所有的依赖
 * @param {String} entryFile 入口文件
 * @return 依赖的所有代码
 */
const getAssets = function (entryFile) {
    const entry = analyze(entryFile)
    const dependencies = [entry]
    for (const asset of dependencies) {
        const dirname = path.dirname(asset.filePath)
        asset.dependencies.forEach(relPath => {
            const absolutePath = path.join(dirname, relPath)
            // 处理css文件
            if (/\.css$/.test(absolutePath)) {
                const content = fs.readFileSync(absolutePath, 'utf-8')
                const cssInsertCode = `
                    const stylesheet = document.createElement('style');
                    stylesheet.innerText = ${JSON.stringify(content)};
                    document.head.appendChild(stylesheet);
                `
                dependencies.push({
                    filePath: absolutePath,
                    relPath,
                    dependencies: [],
                    code: cssInsertCode
                })
            } else {
                const child = analyze(absolutePath)
                child.relPath = relPath
                dependencies.push(child)
            }            
        })
    }
    return dependencies
}

/**
 * 打包流程主函数
 * @param {String} entry 入口文件
 * @return void
 */
const bundle = function (entry) {
    const dependencies = getAssets(entry)
    // 将依赖构建成对象字符串
    const deps = dependencies.map(dep => {
        const filePath = dep.relPath || entry
        // 路径和模块形成映射
        return `'${filePath}':function (exports, require, module) { ${dep.code} }`
    })

    // 构造require函数，babel解析后的代码是node环境下的，我们需要构造相应的函数
    // 模拟原生require，从我们构建的deps中获取相应模块
    const result = `(function(deps){
        function require(path){
            const module = { exports: {} }
            deps[path](module.exports, require, module)
            return module.exports
        }
        require('${entry}')
    })({${deps.join(',')}})`

    // 压缩代码
    // const ast = parser.parse(result, { sourceType: 'script' })
    // const { code } = transformFromAst(ast, null, {
    //     presets: ['minify']
    // })

    // 写入文件
    fs.writeFileSync('./public/vendors.js', result)
}

// 运行打包
bundle('./src/main.js')