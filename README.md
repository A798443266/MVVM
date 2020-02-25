# MVVM
MVVM框架双向数据绑定原理的简单实现

  MVVM是采用数据劫持配合发布者-订阅者的方式，通过Object.defineProperty()来劫持各个属性setter、getter，在数据变动时，发布消息给依赖收集器，去通知观察者，做出对应函数的回调，去更新视图。
  MVVM作为绑定的入口，整合Obersever，Compile和Watcher三者，通过Observer来监听model数据变化，通过Compile来解析编译模板指令，最终利用Watcher搭起Observer，Compile之间的通信桥梁，达到数据变化==>视图更新；视图交互变化==>数据model变更的双向绑定效果。

![image](https://github.com/A798443266/MVVM/blob/master/%E5%8E%9F%E7%90%86%E5%9B%BE.jpg)
