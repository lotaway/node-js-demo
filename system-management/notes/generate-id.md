@[HOC](关于数据所需的id生成)

编程中，对于相同类型数据例如商品、订单、对话消息的存储都需要设置一个独一无二的id，方便用于区别、识别和排序等，这个id可以是纯数字，也可以是英文加数字的字符串。

# 自增id

传统的id一般都是纯数字的，例如从1开始，每次新增数据就在原来的基础上加1，而几乎所有数据库都有对应这种自增id提供了内置的方法，如mysql的auto_increment()
。这种方式既确保了id都是独一无二的，也不需要开发者用额外的代码去操作或计算id值，而是交给数据库本身完成id的计算和赋值，非常方便。
不过这种方式在分布式系统中会有问题：

* 当多个数据库都同时写入数据，1号和2号数据库可能出现都写入id=2的情况；
* 加锁，2号数据库必须等待1号数据库写入id=2之后，2号数据库才写入id=3。
  两种方式都不适合分布式使用，前者出问题，后者违反分布式提升并发效率的用意。
  也有人想出让数据库步增值从1变成2，1号数据库从id=1开始写入，后续id每次+2为[1,3,5,7,...,1+2n]
  ，2号数据库从id=2开始写入，后续id每次+2为[2,4,6,...,2+2n]，这样就能解决上述问题，但无疑如果需要增加更多数据库，或者同步数据等情况都会有问题。

# uuid

后来人们想出了新的方式，就是直接生成随机id，即uuid，通用唯一识别码（Universally Unique
Identifier）的缩写。
不需要根据原本数据库已有的id进行生成，而是直接用大串随机字符串来极可能避免重复id的同时，提升写入效率，部分数据库也内置了这类方法，如mysql的uuid()。
当然这种方式并非永远不会重复，只不过因为生成的字符串够长，并且加入了当前时间轴，让这种重复的几率非常小罢了。
而带来的好处也显而易见，非常适合高并发和分布式的系统。

# guid nanoid

由于这种随机id不依赖数据库已有的数据，让前端直接生成id也成为一种可选项，如nodejs的uuid库，也有很多变种：

* GUID()：微软的 Microsoft's Globally Unique Identifiers，uuid的一种代码实现
* nanoid()：比uuid更短且可读性更好，前后端都有第三方库支持生成
* window.crypto.randomUUID()：前端javascript正在推行的加解密相关接口，其中就包含了此生成uuid的方法