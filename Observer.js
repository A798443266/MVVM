class Observer {
	constructor(data) {
		this.observe(data)
	}

	observe(data) {
		const type = Object.prototype.toString.call(data)
		if (data && type === '[object Object]') {
			Object.keys(data).forEach(key => {
				this.defineReactive(data, key, data[key])
			})
		}
	}

	defineReactive(data, key, value) {
		// 递归遍历劫持数据
		this.observe(value)
		//一个属性对应一个dep
		const dep = new Dep()
		Object.defineProperty(data, key, {
			enumerable: true,
			configurable: false,
			get() {
				// 订阅数据变化时，往Dep中添加观察者
				Dep.target && dep.addSub(Dep.target)
				return value
			},
			// 使用箭头函数让this指向当前Observer
			set: newVal => {
				// 对修改的属性继续观察
				this.observe(newVal)
				if (value !== newVal) {
					value = newVal
				}
				// 通知变化
				dep.notify()
			}
		})
	}
}

class Dep {
	// 每个属性对应一个dep，一个dep对应多个watcher
	constructor() {
		this.subs = []
	}
	addSub(watcher) {
		this.subs.push(watcher)
	}
	notify() {
		this.subs.forEach(w => w.update())
	}
}  

class Watcher {
	constructor(vm, expr, cb) {
		this.vm = vm
		this.expr = expr
		this.cb = cb
		this.oldVal = this.getOldVal()
	}
	getOldVal() {
		/* 
		例如编译指令v-html='msg'时，会创建一个Watcher, 并设置Dep.target为当前的watcher
		当去获data中msg值的时候，会走到代理的get方法，在里面把当前的watcher添加到msg属性对应的dep中
		*/
		Dep.target = this
		const oldVal = compileUtil.getValue(this.vm, this.expr)
		Dep.target = null
		return oldVal
	}
 
	update() {
		const newVal = compileUtil.getValue(this.vm, this.expr)
		if (newVal !== this.oldVal) {
			this.cb && this.cb(newVal)
			//重置当前watcher的oldVal
			this.oldVal = newVal
		}
	}
}