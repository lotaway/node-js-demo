@[TOC](音视频与直播流-基础介绍)

音视频直播一般是采用C++调用第三方库FFmpeg、Gstreamer的函数进行编码解码等常用处理，当然C#、Python、Rust也可以使用一些调用C++库的方式来使用FFmpeg，如果涉及到深入优化功能，则需要自行完成对各种协议、格式的处理。
也可以调用腾讯、阿里云的云直播服务来开发与展现，或者考虑目睹、广电云直播的完整服务直接进行嵌入即可。

# 视频

视频有各种格式如mp4、avi、flv，这称为视频封装格式，封装的不是单纯视频数据，而是一个包含视频数据在内的文件信息压缩包。
不同的封装格式的视频文件内部编码格式和结构也不同，这会影响播放器的选择和观看体验。
了解视频文件内部结构和信息、播放方式将有助于音视频的开发处理工作。

## 视频文件信息

主要包含以下信息等：

* 封装格式
* 编码格式
* 元数据
* 音视频数据

这些文件信息用于解封装视频文件，而文件内部的音视频数据是按时间顺序切片、按轨道分为音轨和视频轨、字幕轨等交叉存储为许多小数据块。

### 封装格式

决定视频文件内部结构、音视频数据块大小，封装格式有：

* mp4，应用广、兼容性最好，几乎所有播放器和浏览器都支持，存储的信息比较多导致文件容易过大，适合观看视频只是作为次要功能的网站应用
* avi，适合下载本地有视频播放器解码播放
* flv，适合大量播放短视频文件，长视频也不错，需要Flash或flv.js接管解码播放
* hls，索引+多文件碎片组成，适合长视频，更好地支持拖拉点播

不同的封装格式的视频文件内部结构也不同，但包含的信息内容是大体相同的。
RTMP/HTTP-FLV/Web-RTC/RTSP也是一种直播流封装格式，建立在HTTP/TCP协议之上的封装。
封装格式不影响视频基础数据如分辨率、像素、dpi等，但会影响拖拉点播的索引查找、字幕是否支持外挂、切换语言等。
因此**封装格式并不决定视频质量好坏，但会影响观看体验**，特别是网络环境。

### 编码格式

决定音视频数据压缩算法方式，常见的是H264、H265、AAC等。

### 数据块

不同封装格式的数据块结构不太一样，以下使用mp4格式举例。
mp4格式内的数据块是类似多层树结构，顶层主要有：

* ftyp：存放编码格式、标准等信息
* moov：存放元数据、mdat数据块间的映射关系
* mdat：音视频数据，依赖moov信息推算每帧播放时间

可以看出如果想要mp4文件播放视频比较快速的话，需要在存放上让moov数据块放到mdat数据块之前进行解析。

#### Meta Data 元数据

视频的描述性信息，会包含如时间基、时长、创建时间、宽高等。

## 播放视频流程

获取视频文件->解封装->视频解码/音频解码->输出视频帧/输出音频帧->播放器同步画面和声音播放
由于解封装后的步骤都是对一个个数据块单独进行操作，而一个视频内部有许多数据块，因此这个过程是一边播放视频一边不断重复执行这个流程。

* 解封装：按封装格式读取或存储视频文件内部的数据块
* 解码：数据块是压缩过的，需要使用解码器解码才可播放，而解码器与编码格式需对应。
* 输出帧：每帧图像、音频都有自身的采样格式，图像有YUV、RGB色彩模型，音频会有float等，改变分辨率就是基于采样率修改，这些在解码阶段会一并处理，成功解码后只需要输出即可。
* 音画同步：数据块含有DTS和PTS，数据帧也都包含PTS，使用它们来确保顺序、音画同步。

### 播放器

根据相应的视频封装格式，播放器需要具备对应格式的解封、解编码和放映基础数据的能力才能播放视频。
而浏览器使用的解码器是内嵌的，只能解封固定的几种封装格式。
大部分浏览器只能播放封装格式为mp4，编码格式为H264的视频，并且是不可扩展的，因此播放像FLV时需要Flash插件或flv.js脚本接手完成工作。
这也是为什么不同视频平台下载的特有视频格式往往需要自家的视频播放器才能解码播放。

## 单个视频帧信息

### 分辨率

即图像的长宽像素比大小，一般是16：9或4：3等，常见有3840x2160（4K），2560x1440（2K），1920x1080（1080P高清），1280x720（720P），640x
360（360P），P指的是逐行扫描，还有另一种I是隔行扫描，号称能节省带宽，如1080I

### 像素

指的是分辨率的长宽像素比乘积，如1920*1080=2073600，即200万像素

### dpi

由显示设备和视频分辨率参数决定，如印刷品要求300dpi。

### 色彩空间模型

YUV、RGB，指代像素点用于表现色彩的方式，也会影响色彩的丰富程度。网络视频、图片会采用YUV420的话数据量较少。

## 多个视频帧信息

### 帧率

一秒中的视频帧数量，单位fps，虽然人类眼球能看清的帧率只到24fps，但即使是高于这个帧率也能让画面变得更流畅（跟模糊景象有关），因此视频一般是30fps、60fps，玩游戏会有60fps、120fps、240fps

### DTS

解码时间戳，供给解码器使用确保数据块时间顺序。

### PTS

播放时间戳，供给播放器使用确保顺序播放和音画同步。

### TimeBase

时间基，将1秒分成若干分，如1/9000，DTS和PTS需要乘以TimeBase才能得到帧的相对秒数。

### 码率

即1秒的数据量，单位是Mbps，编码器可以根据最大码率对视频进行有损压缩，而有的视频没有压缩好也会出现视频本身模糊却又依旧占用大量空间。

一般一个1080P、30帧的MP4-H264编码的视频，码率在2~3MBps即很清晰。

## 视频帧类型

以下是H264、H265编码格式采用特有的视频帧的压缩方式：

* I帧，能独立播放，是一个完整的视频帧，数据量大，用于视频画面突变处，视频识别软件会优先处理
* P帧，需要根据前面的I帧/P帧计算出本图像，减少数据量
* B帧，根据前后I帧/P帧计算出本图像，数据量最小，由于需要后帧参与计算，高速场景如直播不使用B帧

如一个像素为1920x1080，色彩空间模型为YUV420的视频帧，占用文件大小为1920x1080x1.5Bytes = 2.97MB
若帧率为25帧/秒，则一分钟视频文件大小为2.97MBx25x60=4.35GB
但这只是理论大小，实际会经过编码器的压缩算法和I帧/P帧/B帧的方式大幅减少数据量。
其中编码器在压缩时只有影响文件大小的值才会参与，如码率、最大码率，但也可能因此发生有损压缩、而分辨率和帧率是转码程序对前面原始数据再进一步进行处理，降低帧率和分辨率等，达成进一步减少体积。

## H264、H265的区别详解

其中H264是一种视频编码格式（注意并不包含音频编码格式），也包含了相应的压缩算法，其算法中还包含了运动补偿、运动补充等特性，可以对相似度较高的一段区间只记录前后图像来计算，这就是前面提到的P帧和I帧，这在H265中也存在，而其他编码格式不一定有。
H265是更加新的编码格式，能让视频文件更小，理论可压缩极限为H264大小的一半，但由于H264的支持/兼容性更好，特别是浏览器不支持，且H265所需的编解码性能和内存更高，所以即使H265更省流量与空间，也比较少派上用场。

## GOP 一组视频帧

GOP即Group of Pictures，一组视频帧，由设置决定，其开头会被定为I帧，如设置为25，则每25帧的开头必定为I帧，结合帧率定为25fps的话，则可以理解为每秒的第一帧都为I帧，但实际应用中，会将GOP设置为帧率的4~5倍，方便在线播放的情况能轻松完成点播（点击跳转到未加载的部分），直播时则会设置为帧率的1~2倍，并禁止B帧，确保画面流畅。

# 音频

## 采样

指代当前那一瞬间的声音样本，多个样本按顺序排列进行存储和播放。

## 位深度

记录单个声音样品数据的容量，决定记录的深度，过深则限制所需软件和硬件，常用8bit/16bit/24bit等，超过32bit/64bit则是过深。

## 声道

同时记录多个位置的声音采样数据，常见单声道/双声道/立体环绕4.1/5.1等，一般双声道采样数是单声道的两倍。

## 采样率

音频采样的频率，1秒钟采样的次数，流畅不失真的高品质音频最低要求40KHz，这是两倍于人类听觉频率上限，常见采样率对应用途：

* 8KHz：音频通话或监控录音
* 22.05KHz/24KHz：FM调频广播
* 44.1KHz：CD品质
* 48KHz：网络视频、电影

## 单个音频帧信息

音频采用一个采样而不是一帧作为单位，但因为单位过小，为了方便将多个采样打包成音频帧进行播放，如10ms或20ms打包成一帧。
采样打包数量由编码格式决定。
位深度为16bit时单个采样数据量即为16bit，采样率48KHz的1分钟音频理论大小为16bitx48000x2x60=10.98MB，但实际会进行无损/有损压缩。

## AAC编码格式详解

AAC默认采样率8KHz~96KHz，音频帧采样个数1024，码率根据具体采样率进行限制。
AAC有很多具体不同的规格，如：
* AAC-LC，最基础最常用的规格
* AAC-HE，包含SBR技术，SBR技术能让低码率下音质更优秀
* AAC-HE v2，包含SBR、PS技术，PS技术能让多个声道数据压缩更高效
* 其他规格

### SBR

Spectral Band Replication，频段复制

### PS

Parametric Stereo，参数立体声

## 多个音频帧信息

### PTS

类似视频的播放时间戳，只不过音频帧是包含多个音频采样，因此播放时间戳只是这份打包帧的开始播放时间。

### 码率

码率即所谓的比特率，音频的数据量大小，单位MBps。
码率的限制是为了限制数据量大小。
原始音频码率：采样数x位深度x声道数。
网络直播/音视频文件码率在128KBps即可。

### 编码格式

即压缩数据的方式：

* 有损压缩：mp3、aac
* 无损压缩：wav、flac
  网络直播/音视频文件采用aac编码方式

# 直播

直播可以是一（直播源）对多（观看端）的节目主播，也可以是多（直播源）对多（观看端）的视频会议，这里主要是讨论一对多的娱乐直播。

## 推流

即推送视频流数据，指直播端或转码程序推送直播画面和音频数据给流媒体服务器和CDN。

## 拉流

即拉取视频流数据，指观看端或转码程序拉取流媒体服务器的直播画面和音频数据。

## 流媒体服务器

视频流数据中转站，负责接收推流和提供拉流地址，由内部软件进行具体协议处理，根据协议不同考虑使用不同软件，如推流RTMP协议使用SRS、Nginx（rtmp-server插件）。
视频流不会真正写入磁盘（如果不需要录像的话），而是在缓存在内存中并不断被新视频流覆盖。
流媒体接收到的推流是可以直接提供给客户端拉流观看的，但一般还会嫁接转码程序。

## 直播流程

主播端直播源推流->流媒体服务器接收->转码程序拉流转码推流->流媒体服务器接收（->推流到CDN服务/CDN服务拉流缓存）->客户端拉流观看

## 录播流程/文件直播

主播端直播源推流->流媒体服务器保存视频文件->转码程序拉流转码推流->流媒体服务器接收（->推流到CDN服务/CDN服务拉流缓存）->
客户端拉流观看

可以看到直播和录播的区别在于，直播是接收直播源推流后保存在内存中，速度快但占用内存，而录播是先保存为文件，速度更慢且占用磁盘写入，两者都对网络带宽要求高。

## 转码

### 转码程序

负责从流媒体服务器拉流并完成视频转码输出多格式推流的程序软件，协议可以是RTMP/HLS/HTTP-FLV/RTSP，由支持该协议的转码程序决定。
转码有视频转码云服务或自己使用视频转码软件完成操作。
视频转码云服务是按照时间计费，

### 转码流程

解封装->解码->处理->编码->封装，具体过程处理参考视频转码。

直播与视频文件转码的最大区别是封装格式，直播需要在接收直播源时和封装后输出时进行特殊处理。

### 转码作用

转码过程可以添加水印，但主要是分辨率（480p流畅/720p高清/1080p超清）、帧率（30/60/120）、码率/取样率（Mbps，单位时间传送数据位数）、保留直播录像、开播倒计时、信号中断补帧与重放、导播/轮播、画中画等。
如果不需要转码、不考虑网络带宽问题（由视频码率决定），也可以让直播流程简化为：直播端推流->流媒体服务器接收->客户端拉流观看
网络带宽所需由视频码率决定，如流媒体服务器100MB带宽下的2Mbps（即2MB）视频码率，客户端直接拉流的话只能支持100/2=50人观看，所以一般需要嫁接转码程序来根据需要压缩降低码率。
即使有转码程序的情况下，也会将转码输出推流到CDN服务进行缓存，进一步降低多人观看对带宽的直接需求。

## 观看直播

客户端观看采用的协议是HTTP-FLV/HLS等，有低延迟要求则采用RTMP/Web-RTC等。
主流浏览器禁用Flash后是不支持RTMP协议的。
客户端会拉流CDN或者流媒体服务器进行观看，而CDN服务会附带协议转换（单纯根据要求协议解封装和再封装，但没提供其他转码功能），提供RTMP/HTTP-FLV/Web-RTC/HLS等协议的观看地址。

## 直播协议

大部分直播协议都是流媒体传输协议，少量像HLS看似是流媒体，实际是文件传输协议。

### RTMP

Real Time Messaging Protocol 实时消息传输协议，经由FLV格式封装，基于TCP长连接，rtmp:
//开头，切片视频流数据进行传输再合并，约1~3秒延迟。数据块小，失败重发成本低，但合并对CPU有压力，主要用于直播源推流和数据传递推拉流，想要用于客户端观看的话需要浏览器Flash/AIR支持。变种包括RTMPT/RTMPS/RTMPE等。

### HTTP-FLV

Http Flash Video 网页流媒体视频协议，与RTMP一样经由FLV格式封装，http:// 开头，也是切片传输合并，约1~
3秒延迟，流媒体服务器需要软甲如Nginx（HTTP-FLV插件）支持，然后客户端引入如[bilibili/flv.js库](https://github.com/bilibili/flv.js)
进行拉流观看直播。

### HLS

HTTP Live Streaming 基于HTTP的动态码率自适应流媒体传输协议，由苹果推行的标准协议，用于拉流观看。
包含.m3u8索引文件和大量.ts视频碎片文件，索引文件可以包含不同清晰度的视频碎片文件路径，而视频碎片只包含几秒内容，通过此方式获取地址即可进行播放和拖拉回放。
客户端通常加入HLS.js库即可观看，苹果设备则是原生支持。
如果是直播中生成的文件，由于.ts文件在不断增加，.m3u8文件也在不断被修改，因此客户端需要不断获取新的.m3u8文件。
由于文件都是固定在磁盘中，更方便使用CDN负载均衡，也更常见于视频播放和录播的.mp4和.flv而非直播。
类似的协议有MPEG-DASH

### Web-RTC

Web Real Time Communications 网页实时通讯技术，webrtc:
//开头，点对点的视频语音通话协议，也可传输任意其他数据，延迟比RTMP更低，理论1秒内，可用于直播源推流和拉流观看，需要WebRTC服务器作为流媒体服务。

### RTSP

Real Time Streaming Protocol 实时流传输协议，基于TCP/UDP，一般用于摄像头、监控等硬件设备的实时视频流观看与推流，而不会用于直播或者浏览器播放。

# 可用框架

## FFmpeg、GStreamer

FFmpeg、GStreamer可用于编解码处理，能完成视频清晰度转换、视频合成、信号切换、解码播放等。
像直播工具OBS和众多播放器实际都是基于FFmpeg开发的，其面向过程清晰，依据封装、编解码、过滤处理步骤设计。
GStreamer偏向模块化设计，可以通过加入新模块进行异步/线程交互完成操作。

## OpenCV

机器视觉框架OpenCV用于图像分析，进行人像设别、轨迹跟踪等，如对视频流中的人物头像提取并追踪运动轨迹，也可以进一步结合AI框架进行强化特化的操作。
注意OpenCV部分API是编译中可选依赖FFmpeg或gstreamer实现。

## OpenGL

生成3维模型等，根据摄像头合成虚拟形象之类，在纯视频处理中用得比较少。

# 参考来源

[视频讲解音视频处理](https://www.bilibili.com/video/BV1ZG4y1U7G8)