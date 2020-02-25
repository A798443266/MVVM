class MVVM {
	constructor(options) {
		this.$el = options.el
		this.$data = options.data
		this.$options = options
		if (this.$el) {
			// 1.实现一个数据的观察者
			new Observer(this.$data)
			// 2.实现一个指令解析器
			new Compile(this.$el, this)
			// 3.代理数据
			this.proxyData(this.$data)
		}
	}
	// 代理data中的数据，这样可以在外部直接this.xxx调用
	proxyData(data) {
		if (data && Object.prototype.toString.call(data) === '[object Object]') {
			Object.keys(data).forEach(key => {
				Object.defineProperty(this, key, {
					configurable: false,
					enumerable: true,
					get() {
						return data[key]
					},
					set(val) {
						data[key] = val
					}
				})
			})
		}
	}
}

