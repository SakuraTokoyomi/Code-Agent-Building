# WSL环境安装和运行指南

## 当前配置状态

✅ DeepSeek API密钥已配置
✅ 项目文件已创建完成
✅ 默认provider已设置为deepseek

## 安装步骤（WSL环境）

### 1. 安装Python依赖

在WSL中运行以下命令安装pip和依赖包：

```bash
# 如果没有pip，先安装pip
sudo apt update
sudo apt install python3-pip -y

# 安装项目依赖
pip3 install openai requests colorama tqdm

# 或者使用requirements.txt
pip3 install -r requirements.txt
```

### 2. 设置环境变量

由于API密钥已经在.env文件中配置，您需要加载它：

```bash
# 方法1: 导出环境变量
export DEEPSEEK_API_KEY=sk-226c9e971964490f84af440cbdb81f62

# 方法2: 使用python-dotenv自动加载（推荐）
pip3 install python-dotenv
```

### 3. 测试系统

```bash
# 运行系统测试
python3 test_system.py
```

### 4. 运行默认任务（arXiv CS Daily）

```bash
# 运行默认的arXiv CS Daily网页生成任务
python3 main.py
```

### 5. 运行自定义任务

```bash
# 使用自定义任务描述
python3 main.py --task "创建一个待办事项列表应用"

# 跳过评估阶段以加快速度
python3 main.py --no-evaluation

# 指定输出目录
python3 main.py --output ./my_project
```

## 在Windows中查看生成的文件

生成的文件会保存在WSL的文件系统中，您可以：

**方法1: 在Windows文件资源管理器中访问**
```
\\wsl$\Ubuntu\mnt\g\HKU_course\data_mining\Code-Agent\output
```

**方法2: 在WSL中打开Windows资源管理器**
```bash
explorer.exe output/
```

**方法3: 在浏览器中打开生成的HTML**
```bash
# 在output目录中生成HTML后
explorer.exe output/index.html
```

## 常见问题排查

### 问题1: python命令找不到

**解决方案：** WSL中使用python3
```bash
python3 main.py  # 而不是 python main.py
```

### 问题2: pip命令找不到

**解决方案：** 安装pip
```bash
sudo apt update
sudo apt install python3-pip -y
```

### 问题3: API连接失败

**解决方案：** 检查网络和API密钥
```bash
# 测试API连接
curl -H "Authorization: Bearer sk-226c9e971964490f84af440cbdb81f62" \
     https://api.deepseek.com/v1/models
```

### 问题4: 权限错误

**解决方案：** 确保输出目录可写
```bash
chmod 755 ./output
chmod 755 ./logs
```

### 问题5: 模块导入错误

**解决方案：** 重新安装依赖
```bash
pip3 install --upgrade openai requests colorama tqdm
```

## 项目目录结构

```
Code-Agent/
├── main.py              # 主入口（使用python3 main.py运行）
├── orchestrator.py      # 多智能体协调器
├── agents.py            # 三个专业智能体
├── llm_client.py        # LLM API客户端
├── tools.py             # 工具包
├── config.py            # 配置文件
├── .env                 # API密钥配置（已配置）
├── requirements.txt     # Python依赖
├── test_system.py       # 系统测试
├── README.md            # 完整文档
├── QUICK_START.md       # 快速开始
├── examples.py          # 使用示例
├── logs/                # 日志目录
└── output/              # 生成的代码输出目录
```

## 使用示例

### 示例1: 生成待办事项应用
```bash
python3 main.py --task "创建一个待办事项Web应用，使用Bootstrap UI，支持添加、删除、标记完成功能，使用localStorage保存数据"
```

### 示例2: 生成天气仪表板
```bash
python3 main.py --task "构建一个天气仪表板，显示当前天气和5天预报，支持城市搜索，使用Bootstrap响应式设计"
```

### 示例3: 快速测试（跳过评估）
```bash
python3 main.py --no-evaluation
```

## 性能优化建议

1. **使用--no-evaluation加快开发速度**
   ```bash
   python3 main.py --no-evaluation
   ```

2. **在WSL中使用SSD目录以提高性能**
   - 项目已经在/mnt/g下，这是Windows的G盘
   - 如果性能慢，可以移到WSL的home目录：~

3. **查看实时日志**
   ```bash
   # 在另一个终端窗口
   tail -f logs/agent_system.log
   ```

## 下一步操作

1. 安装Python依赖：`pip3 install -r requirements.txt`
2. 测试系统：`python3 test_system.py`
3. 运行默认任务：`python3 main.py`
4. 在Windows中查看生成的文件：`explorer.exe output/`

## 联系方式

如有问题，请联系：
- TA: Zongwei Li (zongwei9888@gmail.com)
- TA: Yangqin Jiang (mrjiangyq99@gmail.com)
