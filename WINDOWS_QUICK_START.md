# Windows环境运行指南

## 您的配置已完成 ✓

- DeepSeek API密钥: 已配置
- 默认provider: deepseek
- 项目文件: 已创建

## 快速开始（Windows）

### 1. 安装依赖包

在Windows命令提示符或PowerShell中运行：

```bash
cd G:\HKU_course\data_mining\Code-Agent
pip install openai requests colorama tqdm python-dotenv
```

如果使用pip3：
```bash
pip3 install openai requests colorama tqdm python-dotenv
```

或者使用requirements.txt一次性安装：
```bash
pip install -r requirements.txt
```

### 2. 测试系统

```bash
python test_system.py
```

### 3. 运行PDF要求的测试用例（arXiv CS Daily网页生成）

```bash
python main.py
```

这将生成arXiv CS Daily网页，包含：
- 领域分类导航（cs.AI, cs.CV, cs.LG等）
- 每日论文列表
- 论文详情页面
- 引用生成功能

### 4. 查看生成的文件

生成的文件在：
```
G:\HKU_course\data_mining\Code-Agent\output\
```

用浏览器打开index.html即可查看生成的网页。

### 5. 其他运行选项

**跳过评估阶段（更快）：**
```bash
python main.py --no-evaluation
```

**自定义任务：**
```bash
python main.py --task "创建一个待办事项列表应用"
```

**指定输出目录：**
```bash
python main.py --output ./my_project
```

## 常见问题

### 如果python命令不存在

使用python3：
```bash
python3 main.py
```

### 如果pip安装失败

尝试：
```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 如果API连接失败

确认网络连接正常，或检查DeepSeek API服务状态。

## 输出文件说明

运行成功后会生成：
- `output/index.html` - 主页面
- `output/css/` - 样式文件
- `output/js/` - JavaScript文件
- `output/result.json` - 执行结果摘要
- `output/execution_log.json` - 详细执行日志
- `logs/agent_system.log` - 系统日志
