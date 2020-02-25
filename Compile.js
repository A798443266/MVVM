class Compile {
	constructor(el, vm) {
		this.el = this.isElimentNode(el) ? el : document.querySelector(el)
		this.vm = vm
		//1.获取文档碎片对象放入内存中，减少页面的回流重绘
		const fragment = this.node2Fragment(this.el)
		//2.编译模板
		this.compile(fragment)
		//3.追加子元素到根元素
		this.el.appendChild(fragment)
	}

	// 判断是否为元素节点
	isElimentNode(node) {
		return node.nodeType === 1
	}

	//所有节点转为文档碎片
	node2Fragment(el) {
		const fragment = document.createDocumentFragment()
		let firstChild
		while (firstChild = el.firstChild) {
			fragment.appendChild(firstChild)
		}
		return fragment
	}

	compile(fragment) {
		//得到文档碎片所有子节点（伪数组）
		const nodes = fragment.childNodes;
		[...nodes].forEach(node => {
			if (this.isElimentNode(node)) {
				//元素节点
				this.compileEliment(node)
			} else {
				// 文本节点
				this.compileText(node)
			}
			//递归遍历子节点的子节点
			if (node.childNodes && node.childNodes.length) {
				this.compile(node)
			}
		});
	}

	// 编译元素节点
	compileEliment(node) {
		const attrs = node.attributes;
		[...attrs].forEach(attr => {
			const { name, value: expr } = attr // v-text='msg'
			// 如果是指令  v-text v-html v-model  v-bind:src  v-on:click
			if (name.startsWith('v-')) {
				const [, directive] = name.split('-') // text html model bind:src on:click
				const [dirName, eventName] = directive.split(':') // text html model bind on
				// 更新数据  数据驱动视图
				compileUtil[dirName](node, expr, this.vm, eventName)
				// 数据更新后，删除标签上的指令属性
				node.removeAttribute(`v-${directive}`)
			} else if (name.startsWith('@')) {
				// @click
				const eventName = name.substr(1)
				compileUtil.on(node, expr, this.vm, eventName)
				node.removeAttribute(name)
			}
		})
	}

	// 编译文本节点
	compileText(node) {
		const content = node.textContent
		if (/\{\{(.+?)\}\}/g.test(content)) {
			compileUtil.text(node, content, this.vm)
		}
	}

}

const compileUtil = {
	getValue(vm, expr) {
		// 'person.info.age' 需要循环取出
		// [person, info, age]
		return expr.split('.').reduce((data, cur) => {
			return data[cur]
		}, vm.$data)
	},

	//替换文本节点的旧值，返回最新的值
	getContentValue(expr, vm) {
		return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
			return this.getValue(vm, args[1])
		})
	},

	text(node, expr, vm) {
		const reg = /\{\{(.+?)\}\}/g
		let value
		// 在文本中 expr = {{xx1}}---{{xxx2}}
		if (reg.test(expr)) {
			value = expr.replace(reg, (...args) => {
				// 初始化Watcher
				new Watcher(vm, args[1], () => {
					Updatter.textUpdater(node, this.getContentValue(expr, vm))
				})
				// args[1] 就是匹配出来的xxx1
				return this.getValue(vm, args[1])
			})

		} else { // 在指令上的 v-text='xxx'
			new Watcher(vm, expr, newVal => {
				Updatter.textUpdater(node, newVal)
			})
			value = this.getValue(vm, expr)
		}

		Updatter.textUpdater(node, value)
	},

	html(node, expr, vm) {
		const value = this.getValue(vm, expr)
		// 创建相应的watcher
		new Watcher(vm, expr, newVal => {
			Updatter.htmlUpdater(node, newVal)
		})
		Updatter.htmlUpdater(node, value)
	},

	model(node, expr, vm) {
		const value = this.getValue(vm, expr)
		// 视图 --> 数据 --> 视图  双向数据绑定核心
		node.addEventListener('input', e => {
			let expArr = expr.split('.')
			let val = vm.$data
			expArr.forEach((k, i) => {
				// 非最后一个key，更新val的值
				if (i < expArr.length - 1) {
					val = val[k];
				} else {
					val[k] = e.target.value;
				}
			})
		})
		Updatter.modelUpdater(node, value)
	},

	bind(node, expr, vm, eventName) {
		//bind 只实现了简单的节点属性绑定data中的数据，没有实现类似vue中的绑定style和class等功能
		const value = this.getValue(vm, expr)
		node.setAttribute(eventName, value)
	},

	on(node, expr, vm, eventName) {
		const fn = vm.$options.methods && vm.$options.methods[expr]
		if (fn === undefined) return
		node.addEventListener(eventName, fn.bind(vm), false)
	},
}

const Updatter = {
	textUpdater(node, value) {
		node.textContent = value
	},
	htmlUpdater(node, value) {
		node.innerHTML = value
	},
	modelUpdater(node, value) {
		node.value = value
	},
}
