1. 生成ssh秘钥

	```bash
	ssh-keygen -t rsa -b 4096 -C "yuexin_guo@smail.nju.edu.cn"
	```

	```bash
	cat ~/.ssh/id_rsa.pub
	```

	把整段内容复制

2. 在github中添加ssh秘钥，步骤如下：

	![image-20251225144331229](C:\Users\user\AppData\Roaming\Typora\typora-user-images\image-20251225144331229.png)

	![image-20251225144300601](C:\Users\user\AppData\Roaming\Typora\typora-user-images\image-20251225144300601.png)

	![image-20251225144402881](C:\Users\user\AppData\Roaming\Typora\typora-user-images\image-20251225144402881.png)

	![image-20251225144431561](C:\Users\user\AppData\Roaming\Typora\typora-user-images\image-20251225144431561.png)

	最后一张图，title自定义一下，Key填写刚刚复制的整段内容

	添加完成后，把`All_Devices`下边的那行代码复制（格式为"SHA256:一串代码"，整行复制，包括SHA256）

3. 回到终端，执行以下代码

	```bash
	git config --global user.signingkey 末尾粘贴刚刚复制的那一整行代码
	git config --global commit.gpgSign true
	```

	之后再“推送”时github上就会显示"Verified"