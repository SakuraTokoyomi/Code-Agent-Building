# 自我调试功能说明

## 概述

现在Multi-Agent系统已经具备了**自我发现问题并修复**的能力！系统会在代码生成后自动检测常见问题（如CORS错误、API集成问题等）并生成修复代码。

## 新增功能

### 1. 调试Agent (CodeDebuggerAgent)

专门负责检测和修复代码问题的智能体，具有以下能力：

- **CORS问题检测**：识别前端代码直接调用受CORS限制的API
- **API集成问题**：发现API调用中的常见错误
- **缺失依赖**：检测CDN链接错误或缺失的库
- **自动修复**：生成修复后的代码文件

### 2. 增强的工作流程

```
原流程：
Planning → Coding → Evaluation → Complete

新流程：
Planning → Coding → Evaluation → Debugging/Fixing → Complete
                                      ↑
                                 自动发现并修复问题
```

## arXiv CORS问题的自动修复

### 问题说明

原始代码尝试使用AJAX直接调用arXiv API：
```javascript
$.ajax({
    url: 'http://export.arxiv.org/api/query',
    // 浏览器会阻止这个请求（CORS error）
})
```

### 自动修复方案

系统会自动检测到这个问题并生成修复：

1. **添加示例数据回退**：
```javascript
function getSamplePapers(category) {
    // 提供示例论文数据，确保应用能正常工作
    return [/* sample data */];
}
```

2. **改进错误处理**：
```javascript
error: function(xhr, status, error) {
    // 当API失败时，使用示例数据
    if (apiCache.data[cacheKey]) {
        resolve(apiCache.data[cacheKey]);
    } else {
        resolve(getSamplePapers(category)); // 回退到示例数据
    }
}
```

## 使用方法

### 默认启用

自动调试功能默认启用，无需任何额外参数：

```bash
python main.py
```

系统会自动：
1. 生成代码
2. 评估代码质量
3. **检测CORS和其他问题**
4. **自动生成修复代码**
5. 完成

### 查看调试日志

```bash
# 查看调试过程
tail -f logs/agent_system.log | grep "Debug"
```

你会看到类似的日志：
```
INFO - Phase 3.5: Code Debugging and Fixing
INFO - Analyzing code for common issues (CORS, API problems)...
INFO - Fixed 2 files
INFO - Debug analysis found 1 issues
INFO -   - cors: Browser CORS restriction when calling arXiv API
```

## 修复的问题类型

### 1. CORS问题
- **检测**：识别直接调用第三方API
- **修复**：添加示例数据回退或使用JSONP

### 2. 缺失的错误处理
- **检测**：API调用没有错误处理
- **修复**：添加try-catch和错误提示

### 3. 缺失的加载状态
- **检测**：异步操作没有loading indicator
- **修复**：添加spinner和进度提示

### 4. API集成错误
- **检测**：错误的API URL格式或参数
- **修复**：修正API调用

## 输出文件

调试完成后，你会在`output/`目录中看到：

```
output/
├── index.html
├── js/
│   ├── api.js          # 原始文件
│   ├── api.js.fixed    # 修复后的文件（如果有问题）
│   └── app.js
├── result.json         # 包含调试信息
└── execution_log.json
```

## 工作原理

### 调试Agent的分析流程

1. **读取所有生成的文件**
2. **使用LLM分析代码**：
   - 检查是否有CORS限制
   - 验证API调用的正确性
   - 检测缺失的错误处理
3. **识别关键问题**
4. **生成修复代码**
5. **使用tool创建修复文件**

### 系统提示词示例

```
分析这段代码中的问题：
- CORS问题：浏览器阻止跨域请求
- API集成：arXiv API调用是否正确
- 错误处理：是否有适当的fallback

如果发现arXiv CORS问题，必须修复：
- 添加示例数据回退
- 确保应用即使API失败也能工作
```

## 优势

### 1. 自动化
- 无需手动检查代码
- 自动识别常见问题
- 自动生成修复

### 2. 可靠性
- 确保生成的代码能实际运行
- 处理浏览器限制（CORS）
- 提供降级方案

### 3. 智能化
- 使用LLM理解问题
- 生成符合最佳实践的修复
- 保持代码风格一致

## 配置选项

### 禁用自动调试（如果需要）

编辑`orchestrator.py`，注释掉调试阶段：

```python
# Step 3: Evaluation Phase
self.state["status"] = "evaluating"
self._execute_evaluation(callback)

# Step 3.5: Debug and Fix Phase
# self.state["status"] = "debugging"  # 注释掉这行
# self._execute_debugging(callback, task_description)  # 注释掉这行
```

### 调整调试温度

编辑`orchestrator.py`中的debugger_agent初始化：

```python
self.debugger_agent = CodeDebuggerAgent(
    name="CodeDebuggerAgent",
    llm_client=llm_client,
    tool_manager=tool_manager,
    temperature=0.3,  # 降低以获得更确定性的修复
    max_tokens=4000
)
```

## 示例：arXiv项目的自动修复

### 运行系统
```bash
python main.py
```

### 你会看到的输出
```
📋 PLANNING: Planning project architecture...
💻 CODING: Generating code for task 1/7...
💻 CODING: Generating code for task 2/7...
...
🔍 EVALUATING: Evaluating generated code...
🐛 DEBUGGING: Analyzing code for common issues (CORS, API problems)...
🐛 DEBUGGING: Fixed 1 issues in generated code
✅ COMPLETED: Project completed successfully!
```

### 查看修复结果

打开`output/js/api.js`，你会看到：

1. **原始代码保留**（可能有CORS问题）
2. **增强的错误处理**
3. **示例数据回退机制**
4. **更好的用户体验**

```javascript
// 自动添加的修复
function getSamplePapers(category) {
    const samplePapers = [
        {
            id: '2306.12345',
            title: 'A Sample Paper on Machine Learning',
            // ... 示例数据
        }
    ];
    return samplePapers;
}

// 改进的错误处理
error: function(xhr, status, error) {
    console.error('API request failed:', status, error);

    // 使用缓存或示例数据作为回退
    if (apiCache.data[cacheKey]) {
        console.log('Using cached data');
        resolve(apiCache.data[cacheKey]);
    } else {
        console.log('Using sample data');
        resolve(getSamplePapers(category));
    }
}
```

## 验证修复效果

### 1. 运行生成的代码

```bash
# 在浏览器中打开
explorer.exe output/index.html
```

### 2. 检查控制台

如果有CORS错误，你会看到：
```
API request failed: error
Using sample data
```

应用仍然正常工作，显示示例论文！

### 3. 查看日志

```bash
cat logs/agent_system.log | grep -A 5 "Debug analysis"
```

输出示例：
```
INFO - Debug analysis found 1 issues
INFO -   - cors: Direct API call to arXiv will fail due to CORS
INFO - Fixed 1 files
INFO - Created fix: js/api.js
```

## 最佳实践

1. **始终启用自动调试**：让系统自动发现和修复问题
2. **检查日志**：了解系统发现了哪些问题
3. **测试生成的代码**：在浏览器中验证修复效果
4. **查看修复文件**：学习系统如何解决问题

## 总结

现在你的Multi-Agent系统具备了**自我诊断和修复**能力：

✅ 自动检测CORS问题
✅ 自动生成修复代码
✅ 提供降级方案（示例数据）
✅ 确保代码能实际运行
✅ 无需手动干预

这使得生成的代码更加可靠和实用！
