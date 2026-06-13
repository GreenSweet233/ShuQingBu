# 抒情簿

个人思考记录阅读器 — PWA 应用

![预览](assets/preview.png)

## 维护流程

修改 Excel 后，打开命令行执行：

```
cd /d D:\Windows\GreenSweet\小本本备份\抒情簿AI_Project
python scripts\export_json.py
```

然后 commit & push 到 GitHub：

```
git add -A
git commit -m "更新"
git push
```

等待 1-2 分钟，手机打开 https://greensweet233.github.io/ShuQingBu/ 即可看到更新。

### 本地调试

```
cd /d D:\Windows\GreenSweet\小本本备份\抒情簿AI_Project
python -m http.server 8080
```

手机连同一 WiFi，浏览器打开 `http://你的电脑IP:8080` 即可访问。

## 文件说明

| 文件 | 用途 |
|------|------|
| `scripts/export_json.py` | Excel → JSON 转换（手动运行） |
| `index.html` | PWA 主页面 |
| `data/entries.json` | 条目数据（自动生成，勿手动编辑） |
| `sw.js` | Service Worker（离线缓存） |
| `manifest.json` | PWA 安装清单 |

## 手机安装

打开 https://greensweet233.github.io/ShuQingBu/ → Edge 菜单 → 添加到手机 → 安装
