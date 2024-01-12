# NIO demo

```java
public class NioServer implements Runnable {
    public static void main(String[] args) {
        new Thread(new NioServer(8080)).start();
    }
    private Selector selector;
    private ServerSocketChannel serverChannel;
    public NioServer(int port) {
        try {
            selector = Selector.open();
            serverChannel = ServerSocketChannel.open();
            serverChannel.socket().bind(new InetSocketAddress(port), 1024);
            serverChannel.configureBlocking(false);
            serverChannel.register(selector, SelectionKey.OP_ACCEPT);
        } catch (IOException e) {
        }
    }
    public void run() {
       
    }
}
```

## NIO 步骤

> 1. 创建Channel并设置非阻塞
> 2. Channel绑定地址
> 3. Channel注册Selector

# Netty如何实现NIO

基于nett4.1.43.Final 分析代码

``` java

    public static void main(String[] args) throws Exception {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
             .channel(NioServerSocketChannel.class)
             .handler(new LoggingHandler(LogLevel.INFO))
             .childHandler(new HexDumpProxyInitializer(REMOTE_HOST, REMOTE_PORT))
             .childOption(ChannelOption.AUTO_READ, false)
             .bind(LOCAL_PORT).sync().channel().closeFuture().sync();
        } finally {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }
```

程序的入口就是bind方法，先找到初始化ServerSocketChannel和配置非阻塞的地方，直接定位源码

```java
AbstractNioChannel
		protected AbstractNioChannel(Channel parent, SelectableChannel ch, int readInterestOp) {
        super(parent);
        this.ch = ch;
        this.readInterestOp = readInterestOp;
        try {
            ch.configureBlocking(false);  // 配置非阻塞
        } catch (IOException e) {
            try {
                ch.close();
            } catch (IOException e2) {
                logger.warn(
                            "Failed to close a partially initialized socket.", e2);
            }

            throw new ChannelException("Failed to enter non-blocking mode.", e);
        }
    }
```

找到了配置非阻塞的地方，同时也看到了readInterestOp就是感兴趣的事件，也就是`SelectionKey.OP_ACCEPT`，那在哪进行的类似于`serverChannel.register(selector, SelectionKey.OP_ACCEPT);`这步呢。直接定位，如下

```java
AbstractNioChannel
		protected void doRegister() throws Exception {
        boolean selected = false;
        for (;;) {
            try {
                selectionKey = javaChannel().register(eventLoop().unwrappedSelector(), 0, this);
                return;
            } catch (CancelledKeyException e) {
                if (!selected) {
                    // Force the Selector to select now as the "canceled" SelectionKey may still be
                    // cached and not removed because no Select.select(..) operation was called yet.
                    eventLoop().selectNow();
                    selected = true;
                } else {
                    // We forced a select operation on the selector before but the SelectionKey is still cached
                    // for whatever reason. JDK bug ?
                    throw e;
                }
            }
        }
    }
```

调用栈

```java
register:127, SelectorImpl (sun.nio.ch)
register:212, AbstractSelectableChannel (java.nio.channels.spi)
doRegister:380, AbstractNioChannel (io.netty.channel.nio)
register0:497, AbstractChannel$AbstractUnsafe (io.netty.channel)
access$200:416, AbstractChannel$AbstractUnsafe (io.netty.channel)
run:475, AbstractChannel$AbstractUnsafe$1 (io.netty.channel)
safeExecute$$$capture:163, AbstractEventExecutor (io.netty.util.concurrent)
safeExecute:-1, AbstractEventExecutor (io.netty.util.concurrent)
 - Async stack trace   另外一个线程分界线
addTask:-1, SingleThreadEventExecutor (io.netty.util.concurrent)
execute:886, SingleThreadEventExecutor (io.netty.util.concurrent)
register:472, AbstractChannel$AbstractUnsafe (io.netty.channel)
register:87, SingleThreadEventLoop (io.netty.channel)
register:81, SingleThreadEventLoop (io.netty.channel)
register:86, MultithreadEventLoopGroup (io.netty.channel)
initAndRegister:311, AbstractBootstrap (io.netty.bootstrap)
doBind:260, AbstractBootstrap (io.netty.bootstrap)
bind:256, AbstractBootstrap (io.netty.bootstrap)
bind:234, AbstractBootstrap (io.netty.bootstrap)
```

register相关的就是Channel注册Selector，然后是怎么绑定地址的，就是bind相关的方法，继续跟踪doBind方法

```java

    private static void doBind0(
            final ChannelFuture regFuture, final Channel channel,
            final SocketAddress localAddress, final ChannelPromise promise) {
        // This method is invoked before channelRegistered() is triggered.  Give user handlers a chance to set up
        // the pipeline in its channelRegistered() implementation.
        channel.eventLoop().execute(new Runnable() {
            @Override
            public void run() {
                if (regFuture.isSuccess()) {
                    channel.bind(localAddress, promise).addListener(ChannelFutureListener.CLOSE_ON_FAILURE);
                } else {
                    promise.setFailure(regFuture.cause());
                }
            }
        });
    }
```

继续看他的调用栈

```java
run:344, AbstractBootstrap$2 (io.netty.bootstrap)
safeExecute$$$capture:163, AbstractEventExecutor (io.netty.util.concurrent)
safeExecute:-1, AbstractEventExecutor (io.netty.util.concurrent)
 - Async stack trace
addTask:-1, SingleThreadEventExecutor (io.netty.util.concurrent)
execute:886, SingleThreadEventExecutor (io.netty.util.concurrent)
doBind0:340, AbstractBootstrap (io.netty.bootstrap)
access$000:52, AbstractBootstrap (io.netty.bootstrap)
operationComplete:287, AbstractBootstrap$1 (io.netty.bootstrap)
operationComplete:274, AbstractBootstrap$1 (io.netty.bootstrap)
notifyListener0:577, DefaultPromise (io.netty.util.concurrent)
notifyListenersNow:551, DefaultPromise (io.netty.util.concurrent)
notifyListeners:490, DefaultPromise (io.netty.util.concurrent)
setValue0:615, DefaultPromise (io.netty.util.concurrent)
setSuccess0:604, DefaultPromise (io.netty.util.concurrent)
trySuccess:104, DefaultPromise (io.netty.util.concurrent)
trySuccess:84, DefaultChannelPromise (io.netty.channel)
safeSetSuccess:985, AbstractChannel$AbstractUnsafe (io.netty.channel)
register0:505, AbstractChannel$AbstractUnsafe (io.netty.channel)
access$200:416, AbstractChannel$AbstractUnsafe (io.netty.channel)
run:475, AbstractChannel$AbstractUnsafe$1 (io.netty.channel)
safeExecute$$$capture:163, AbstractEventExecutor (io.netty.util.concurrent)
safeExecute:-1, AbstractEventExecutor (io.netty.util.concurrent)
 - Async stack trace
addTask:-1, SingleThreadEventExecutor (io.netty.util.concurrent)
execute:886, SingleThreadEventExecutor (io.netty.util.concurrent)
register:472, AbstractChannel$AbstractUnsafe (io.netty.channel)
register:87, SingleThreadEventLoop (io.netty.channel)
register:81, SingleThreadEventLoop (io.netty.channel)
register:86, MultithreadEventLoopGroup (io.netty.channel)
initAndRegister:311, AbstractBootstrap (io.netty.bootstrap)
doBind:260, AbstractBootstrap (io.netty.bootstrap)
bind:256, AbstractBootstrap (io.netty.bootstrap)
bind:234, AbstractBootstrap (io.netty.bootstrap)
```

到这，开始跟踪细节，先看几个重要的类，找一下关系，

```java
Bootstrap  ServerBootstrap
Channel  ServerChannel    NioServerSocketChannel   EpollServerSocketChannel
NioEventLoop  EventLoopGroup  Executor
```

Bootstrap是client端专用，ServerBootstrap是Server端专用，ServerBootstrap需要设置两个EventLoopGroup，分别是bossGroup和workerGroup(EventLoopGroup)。bossGroup负责处理请求，workerGroup负责业务处理。我们demo中设置的都是NioEventLoopGroup，查看类关系可以发现EventLoopGroup和EventLoop都继承了java.util.concurrent.ExecutorService，既他俩的作用都是提交处理一个任务，EventLoopGroup有next()方法，可以理解成一组EventLoop的抽象，处理新task时，通过next方法选出一个EventLoop来真正的处理task。一个EventLoop在生命周期内只与一个线程绑定(主句话很重要，netty的handler内的处理都是同一个线程，知道这个规则可以忽略一些线程安全的问题)，当一个SocketChannel请求连接，先由bossGroup负责连接，连接成功后，转发给workGroup，连接时会生成一个ChannelPipline并绑定配置的ChannelHandler，ChannelHandler是通过EventLoop处理传递给他的事件的。所以在处理事件时不能阻塞线程，可以用EventExecutorGroup来异步的执行。

经过说明，我们还有几点没考虑明白：

1. 怎么把handler绑定到SocketChannel上的
2. bossGroup是怎么把SocketChannel传递给workerGroup的
3. workerGroup是怎么处理请求的
4. workerGroup处理完请求后是怎么通知bossGroup，并把处理结果带回去的
5. 当workerGroup处理阻塞的IO操作时可以使用EventExecutorGroup，那它的处理结果怎么返回

## 1 怎么把handler绑定到SocketChannel上的

```java
NioEventLoop
		protected void run() {
        for (;;) {
            try {
                try {
                    switch (selectStrategy.calculateStrategy(selectNowSupplier, hasTasks())) {
                    case SelectStrategy.CONTINUE:
                        continue;

                    case SelectStrategy.BUSY_WAIT:
                        // fall-through to SELECT since the busy-wait is not supported with NIO

                    case SelectStrategy.SELECT:
                        select(wakenUp.getAndSet(false));

                        if (wakenUp.get()) {
                            selector.wakeup();
                        }
                        // fall through
                    default:
                    }
                } catch (IOException e) {
                    // If we receive an IOException here its because the Selector is messed up. Let's rebuild
                    // the selector and retry. https://github.com/netty/netty/issues/8566
                    rebuildSelector0();
                    handleLoopException(e);
                    continue;
                }

                cancelledKeys = 0;
                needsToSelectAgain = false;
                final int ioRatio = this.ioRatio;
                if (ioRatio == 100) {
                    try {
                        processSelectedKeys();
                    } finally {
                        // Ensure we always run tasks.
                        runAllTasks();
                    }
                } else {
                    final long ioStartTime = System.nanoTime();
                    try {
                        processSelectedKeys();
                    } finally {
                        // Ensure we always run tasks.
                        final long ioTime = System.nanoTime() - ioStartTime;
                        runAllTasks(ioTime * (100 - ioRatio) / ioRatio);
                    }
                }
            } catch (Throwable t) {
                handleLoopException(t);
            }
            // Always handle shutdown even if the loop processing threw an exception.
            try {
                if (isShuttingDown()) {
                    closeAll();
                    if (confirmShutdown()) {
                        return;
                    }
                }
            } catch (Throwable t) {
                handleLoopException(t);
            }
        }
    }

    private void processSelectedKeys() {
        if (selectedKeys != null) {
            processSelectedKeysOptimized();
        } else {
            processSelectedKeysPlain(selector.selectedKeys());
        }
    }


    private void processSelectedKeysPlain(Set<SelectionKey> selectedKeys) {
		......
                processSelectedKey(k, task);
		......
    }
    private void processSelectedKeysOptimized() {
		......
                processSelectedKey(k, task);
		......
    }

    private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();    // NioMessageUnsafe
        ......
            if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
                unsafe.read();
            }
        ......
    }


NioMessageUnsafe
        public void read() {
            assert eventLoop().inEventLoop();
            final ChannelConfig config = config();
            final ChannelPipeline pipeline = pipeline();
            final RecvByteBufAllocator.Handle allocHandle = unsafe().recvBufAllocHandle();
            allocHandle.reset(config);

            boolean closed = false;
            Throwable exception = null;
            try {
                try {
                    do {
                        int localRead = doReadMessages(readBuf);  // <-
                        if (localRead == 0) {
                            break;
                        }
                        if (localRead < 0) {
                            closed = true;
                            break;
                        }

                        allocHandle.incMessagesRead(localRead);
                    } while (allocHandle.continueReading());
                } catch (Throwable t) {
                    exception = t;
                }

                int size = readBuf.size();
                for (int i = 0; i < size; i ++) {
                    readPending = false;
                    pipeline.fireChannelRead(readBuf.get(i));   // <-
                }
                readBuf.clear();
                allocHandle.readComplete();
                pipeline.fireChannelReadComplete();             // <-

                if (exception != null) {
                    closed = closeOnReadError(exception);

                    pipeline.fireExceptionCaught(exception);    // <-
                }

                if (closed) {
                    inputShutdown = true;
                    if (isOpen()) {
                        close(voidPromise());
                    }
                }
            } finally {
                // Check if there is a readPending which was not processed yet.
                // This could be for two reasons:
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelRead(...) method
                // * The user called Channel.read() or ChannelHandlerContext.read() in channelReadComplete(...) method
                //
                // See https://github.com/netty/netty/issues/2254
                if (!readPending && !config.isAutoRead()) {
                    removeReadOp();
                }
            }
        }
    }

NioServerSocketChannel
    protected int doReadMessages(List<Object> buf) throws Exception {
        SocketChannel ch = SocketUtils.accept(javaChannel());

        try {
            if (ch != null) {
                buf.add(new NioSocketChannel(this, ch));
                return 1;
            }
        } catch (Throwable t) {
            logger.warn("Failed to create a new channel from an accepted socket.", t);

            try {
                ch.close();
            } catch (Throwable t2) {
                logger.warn("Failed to close a socket.", t2);
            }
        }

        return 0;
    }

DefaultChannelPipeline
    public final ChannelPipeline fireChannelRead(Object msg) {
        AbstractChannelHandlerContext.invokeChannelRead(head, msg);
        return this;
    }

AbstractChannelHandlerContext
    static void invokeChannelRead(final AbstractChannelHandlerContext next, Object msg) {
        final Object m = next.pipeline.touch(ObjectUtil.checkNotNull(msg, "msg"), next);
        EventExecutor executor = next.executor();
        if (executor.inEventLoop()) {
            next.invokeChannelRead(m);
        } else {
            executor.execute(new Runnable() {
                @Override
                public void run() {
                    next.invokeChannelRead(m);
                }
            });
        }
    }

    private void invokeChannelRead(Object msg) {
        if (invokeHandler()) {
            try {
                ((ChannelInboundHandler) handler()).channelRead(this, msg); // 现在的事件点为IN，从head -> serverBootstrapAcceptor -> tail     这个channelRead就是handler调用了自己写的handler
            } catch (Throwable t) {
                notifyHandlerException(t);
            }
        } else {
            fireChannelRead(msg);
        }
    }

ServerBootstrapAcceptor
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            final Channel child = (Channel) msg;

            child.pipeline().addLast(childHandler);

            setChannelOptions(child, childOptions, logger);
            setAttributes(child, childAttrs);

            try {
                childGroup.register(child).addListener(new ChannelFutureListener() {
                    @Override
                    public void operationComplete(ChannelFuture future) throws Exception {
                        if (!future.isSuccess()) {
                            forceClose(child, future.cause());
                        }
                    }
                });
            } catch (Throwable t) {
                forceClose(child, t);
            }
        }
```

在ServerBootstrapAcceptor中，msg就是channel对象，在pipline中添加了childHandler即配置的匿名ChannelInitializer，它会在其他的Handler加到pipline中。childGroup.register(child)把channel注册到childGroup即workerGroup中进行监听请求

## bossGroup是怎么把SocketChannel传递给workerGroup的

上面提到的register过程就是交给workerGroup去处理

## Encoder、Decoder、ChannelOutboundHandlerAdapter、ChannelInboundHandlerAdapter，配置了多个Encoder、Decoder什么效果

对于handler，写代码的时候会是这种

```java
			ServerBootstrap b = new ServerBootstrap();
			b.group(bossGroup, workerGroup)
				.channel(NioServerSocketChannel.class)
				.option(ChannelOption.SO_BACKLOG, 100)
				.childHandler(new ChannelInitializer<SocketChannel>() {
					public void initChannel(SocketChannel ch) throws Exception {
						ch.pipeline().addLast(
							new StringEncoder(CharsetUtil.UTF_8),
							new LineBasedFrameDecoder(1024),
							new StringDecoder(CharsetUtil.UTF_8),
							new Base64Decoder(),
							new ServerHandler());
					}
				});
```

在看一眼Encoder、Decoder和Handler之间的关系，已StringEncoder和StringDecoder举例

```java
public class StringEncoder extends MessageToMessageEncoder<CharSequence>{}
public abstract class MessageToMessageEncoder<I> extends ChannelOutboundHandlerAdapter {}

public class StringDecoder extends MessageToMessageDecoder<ByteBuf> {}
public abstract class MessageToMessageDecoder<I> extends ChannelInboundHandlerAdapter {}
```

Encoder就是ChannelOutboundHandlerAdapter，Decoder就是ChannelInboundHandlerAdapter，netty中Hander分为进站和出站Handler，进站就从数据从外面进到服务(read过程)，出站就是服务提供数据(write过程)。一个Channel产生就绑定了一个ChannelHandlerPipeline，pipeline上组装了多个Handler，那么Handler处理的时候就有顺序问题。对于进站时，Handler处理的过程从前到后；对于出站时，Handler处理顺序从后到前。那么对于一个Pipeline上多个Encoder而言，前面的处理数据的结果就是下个Encoder的入参。使用时还需注意，对于不匹配的Handler(Encoder/Decoder)，会跳过处理。比如这样：从键盘获取输入发送到Server端的一个Client

```java

	public void run() throws InterruptedException, IOException {
		EventLoopGroup workerGroup = new NioEventLoopGroup();

		try {
			Bootstrap b = new Bootstrap();
			b.group(workerGroup);
			b.channel(NioSocketChannel.class);
			b.handler(new ChannelInitializer<SocketChannel>() {
				@Override
				public void initChannel(SocketChannel ch) throws Exception {
					ch.pipeline().addLast("Base64Encoder", new CustomBase64Encoder());
					ch.pipeline().addLast("StringEncoder1", new CustomStringEncoder1(CharsetUtil.UTF_8));
					ch.pipeline().addLast("StringEncoder", new CustomStringEncoder(CharsetUtil.UTF_8));

					ch.pipeline().addLast("decoder", new StringDecoder(CharsetUtil.UTF_8));
					ch.pipeline().addLast(new ClientHandler());
				}
			});

			ChannelFuture f = b.connect(host, port).sync(); // (5)
			Channel channel = f.channel();
			
			BufferedReader in = new BufferedReader(new InputStreamReader(System.in));
			while (true) {
				String s = in.readLine();
				System.out.println("write " + s);
				channel.writeAndFlush(s);
			}
			
		} finally {
			workerGroup.shutdownGracefully();
		}
	}

	public static class ClientHandler extends SimpleChannelInboundHandler<Object> {
		@Override
		protected void channelRead0(ChannelHandlerContext ctx, Object msg) throws Exception {
			System.out.println("channelRead0 [" + msg.getClass() + "] " + msg);
		}
	}

	public static class CustomBase64Encoder extends Base64Encoder {
		@Override
		protected void encode(ChannelHandlerContext ctx, ByteBuf msg, List<Object> out) throws Exception {
			String s = msg.toString(CharsetUtil.UTF_8);
			System.out.println("CustomBase64Encoder.encode " + s);
			ByteBuf byteBuf = Unpooled.copiedBuffer("CustomBase64Encoder:" + s, CharsetUtil.UTF_8);
			super.encode(ctx, byteBuf, out);
		}
	}
	public static class CustomStringEncoder extends StringEncoder {
		public CustomStringEncoder(Charset charset) { super(charset); }
		@Override
		protected void encode(ChannelHandlerContext ctx, CharSequence msg, List<Object> out) throws Exception {
			System.out.println("CustomStringEncoder.encode " + msg.toString());
			String cs = "CustomStringEncoder:" + msg.toString();
			super.encode(ctx, cs, out);
		}
	}
	public static class CustomStringEncoder1 extends StringEncoder {
		public CustomStringEncoder1(Charset charset) { super(charset); }
		@Override
		protected void encode(ChannelHandlerContext ctx, CharSequence msg, List<Object> out) throws Exception {
			System.out.println("CustomStringEncoder1.encode " + msg.toString());
			String cs = "CustomStringEncoder1:" + msg.toString();
			super.encode(ctx, cs, out);
		}
	}
```

这里，Encoder执行顺序为：CustomStringEncoder -> CustomBase64Encoder。CustomStringEncoder1并不会执行，为啥，跟踪源码：

执行到`channel.writeAndFlush(s);`时，点进去

```java
write:783, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:757, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:812, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:1037, DefaultChannelPipeline (io.netty.channel)
writeAndFlush:293, AbstractChannel (io.netty.channel)
```

```java

    private void write(Object msg, boolean flush, ChannelPromise promise) {
        ......
        final AbstractChannelHandlerContext next = findContextOutbound(flush ?    // <-
                (MASK_WRITE | MASK_FLUSH) : MASK_WRITE);
        final Object m = pipeline.touch(msg, next); 
        EventExecutor executor = next.executor();
        if (executor.inEventLoop()) {
            if (flush) {
                next.invokeWriteAndFlush(m, promise);
            } else {
                next.invokeWrite(m, promise);    // <-  
            }
        } else {
            ......
            if (!safeExecute(executor, task, promise, m)) {
                ......
            }
        }
    }

    private AbstractChannelHandlerContext findContextOutbound(int mask) {
        AbstractChannelHandlerContext ctx = this;
        do {
            ctx = ctx.prev;
        } while ((ctx.executionMask & mask) == 0);
        return ctx;
    }
```

之前说过，出站时，handler从后向前处理，`ctx = ctx.prev;`这个地方能看到是从后向前的，那开始是怎么拿到尾Handler的，

```
AbstractChannel
    public ChannelFuture writeAndFlush(Object msg) {
        return pipeline.writeAndFlush(msg);  
    }
DefaultChannelPipeline
    @Override
    public final ChannelFuture writeAndFlush(Object msg) {
        return tail.writeAndFlush(msg);
    }

public class DefaultChannelPipeline implements ChannelPipeline {
    final AbstractChannelHandlerContext head;
    final AbstractChannelHandlerContext tail;
}
```

与Channel绑定的Pipeline默认实例为DefaultChannelPipeline，维护着head(ChannelHandlerContext(DefaultChannelPipeline$HeadContext#0...)与tail(ChannelHandlerContext(DefaultChannelPipeline$TailContext#0...)。也就是头和尾是并不是我们add进去的，从Pipeline中可以看到链为 

> DefaultChannelPipeline{(Base64Encoder = com.fzk.netty.demo1.multidecode.Client$CustomBase64Encoder), (StringEncoder1 = com.fzk.netty.demo1.multidecode.Client$CustomStringEncoder1), (StringEncoder = com.fzk.netty.demo1.multidecode.Client$CustomStringEncoder), (decoder = io.netty.handler.codec.string.StringDecoder), (Client$ClientHandler#0 = com.fzk.netty.demo1.multidecode.Client$ClientHandler)}

那么ctx.prev就是CustomStringEncoder，因为``(ctx.executionMask & mask) == 0`还判断了出站时需要为OutboundHandler。现在拿到了Handler(CustomStringEncoder)继续看什么时候调用它的处理逻辑，跟踪`safeExecute(executor, task, promise, m)`，

```
AbstractChannelHandlerContext
    private static boolean safeExecute(EventExecutor executor, Runnable runnable, ChannelPromise promise, Object msg) {
        ......
            executor.execute(runnable);
        ......
    }
final class DefaultChannelHandlerContext extends AbstractChannelHandlerContext {}
```

交给了executor异步处理，这个executor在context维护。
继续看，

```java
write:84, MessageToMessageEncoder (io.netty.handler.codec)
invokeWrite0:716, AbstractChannelHandlerContext (io.netty.channel)
invokeWrite:708, AbstractChannelHandlerContext (io.netty.channel)
access$1700:56, AbstractChannelHandlerContext (io.netty.channel)
write:1102, AbstractChannelHandlerContext$AbstractWriteTask (io.netty.channel)
write:1149, AbstractChannelHandlerContext$WriteAndFlushTask (io.netty.channel)
run:1073, AbstractChannelHandlerContext$AbstractWriteTask (io.netty.channel)
safeExecute$$$capture:163, AbstractEventExecutor (io.netty.util.concurrent)
safeExecute:-1, AbstractEventExecutor (io.netty.util.concurrent)
 - Async stack trace
addTask:-1, SingleThreadEventExecutor (io.netty.util.concurrent)    
execute:886, SingleThreadEventExecutor (io.netty.util.concurrent)
safeExecute:1011, AbstractChannelHandlerContext (io.netty.channel)    // executor.execute(runnable);
write:800, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:757, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:812, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:1037, DefaultChannelPipeline (io.netty.channel)
writeAndFlush:293, AbstractChannel (io.netty.channel)
  
MessageToMessageEncoder
    @Override
    public void write(ChannelHandlerContext ctx, Object msg, ChannelPromise promise) throws Exception {
        CodecOutputList out = null;
        try {
            if (acceptOutboundMessage(msg)) {
                out = CodecOutputList.newInstance();
                ......
                    encode(ctx, cast, out);
                ......
            } else {
                ctx.write(msg, promise);   // 类型不支持，由ctx继续处理，寻找下一个handler
            }
        ...... //异常处理
        } finally {
            ......
                    ctx.write(out.getUnsafe(0), promise); // 继续处理
                ......
            }
        }
    }
    public boolean acceptOutboundMessage(Object msg) throws Exception {
        return matcher.match(msg);
    }
```

到MessageToMessageEncoder.write这个MessageToMessageEncoder的实际类型就是我们的CustomStringEncoder，acceptOutboundMessage()判断该Handler是否能处理当前的msg类型，如果支持就调用了Encoder.encode()方法，不支持，继续找下一个Handler处理，找一下个Handler的过程就上面说的ctx.prev并且是OutboundHandler。然后看一下，自定义的CustomStringEncoder继承了StringEncoder，看下StringEncoder的处理逻辑

```java
    protected void encode(ChannelHandlerContext ctx, CharSequence msg, List<Object> out) throws Exception {
        if (msg.length() == 0) {
            return;
        }

        out.add(ByteBufUtil.encodeString(ctx.alloc(), CharBuffer.wrap(msg), charset));
    }
```

意思就是将结果add进了out中，这个out是什么类型的？`out = CodecOutputList.newInstance();`处理完后每个子项类型为`PooledUnsafeDirectByteBuf`，不在是CharSequence，所以下一个找到CustomStringEncoder1时，match匹配那里不在支持该类型，无法处理跳过。encode处理完之后怎么跳转到下一个Handler`ctx.write(out.getUnsafe(0), promise);`。ChannelOutboundHandlerAdapter的实现一般都为Encoder。

看完了Handler怎么处理消息的，这些的目的就是为了在真正的发送数据前，对数据最一些处理，所以，最终的想channel里写数据的地方是哪呢。前面说了，出站时从后往前，最前面的是HeadContext，那就没跑了肯定是在这里，直接定位位置

```java
doWrite:413, NioSocketChannel (io.netty.channel.socket.nio)
flush0:931, AbstractChannel$AbstractUnsafe (io.netty.channel)
flush0:354, AbstractNioChannel$AbstractNioUnsafe (io.netty.channel.nio)
flush:898, AbstractChannel$AbstractUnsafe (io.netty.channel)
flush:1384, DefaultChannelPipeline$HeadContext (io.netty.channel)    // <- 从这开始看
invokeFlush0:749, AbstractChannelHandlerContext (io.netty.channel)
invokeFlush:741, AbstractChannelHandlerContext (io.netty.channel)
flush:727, AbstractChannelHandlerContext (io.netty.channel)
flush:125, ChannelOutboundHandlerAdapter (io.netty.channel)
invokeFlush0:749, AbstractChannelHandlerContext (io.netty.channel)
invokeFlush:741, AbstractChannelHandlerContext (io.netty.channel)    // AbstractChannelHandlerContext.invokeFlush() 实际为
  																																	 //	DefaultChannelPipeline.HeadContext
access$2100:56, AbstractChannelHandlerContext (io.netty.channel)
write:1150, AbstractChannelHandlerContext$WriteAndFlushTask (io.netty.channel)
run:1073, AbstractChannelHandlerContext$AbstractWriteTask (io.netty.channel)
safeExecute$$$capture:163, AbstractEventExecutor (io.netty.util.concurrent)
safeExecute:-1, AbstractEventExecutor (io.netty.util.concurrent)
 - Async stack trace
addTask:-1, SingleThreadEventExecutor (io.netty.util.concurrent)
execute:886, SingleThreadEventExecutor (io.netty.util.concurrent)
safeExecute:1011, AbstractChannelHandlerContext (io.netty.channel)
write:800, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:757, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:812, AbstractChannelHandlerContext (io.netty.channel)
writeAndFlush:1037, DefaultChannelPipeline (io.netty.channel)
writeAndFlush:293, AbstractChannel (io.netty.channel)
```

```java
ChannelHandlerContext(DefaultChannelPipeline$HeadContext)
        public void flush(ChannelHandlerContext ctx) {
            unsafe.flush();
        }
NioSocketChannelUnsafe extends AbstractChannel.AbstractUnsafe   定义了一些不许用户直接访问的方法，
        public void flush(ChannelHandlerContext ctx) {
            unsafe.flush();
        }
```

```java
interface Unsafe
     *   <li>{@link #localAddress()}</li>
     *   <li>{@link #remoteAddress()}</li>
     *   <li>{@link #closeForcibly()}</li>
     *   <li>{@link #register(EventLoop, ChannelPromise)}</li>
     *   <li>{@link #deregister(ChannelPromise)}</li>
     *   <li>{@link #voidPromise()}</li>
```

最后调用

```java
NioSocketChannel
    protected void doWrite(ChannelOutboundBuffer in) throws Exception {
        SocketChannel ch = javaChannel();
        int writeSpinCount = config().getWriteSpinCount();
        do {
            if (in.isEmpty()) {
                // All written so clear OP_WRITE
                clearOpWrite();
                // Directly return here so incompleteWrite(...) is not called.
                return;
            }

            // Ensure the pending writes are made of ByteBufs only.
            int maxBytesPerGatheringWrite = ((NioSocketChannelConfig) config).getMaxBytesPerGatheringWrite();
            ByteBuffer[] nioBuffers = in.nioBuffers(1024, maxBytesPerGatheringWrite);
            int nioBufferCnt = in.nioBufferCount();

            // Always us nioBuffers() to workaround data-corruption.
            // See https://github.com/netty/netty/issues/2761
            switch (nioBufferCnt) {
                case 0:
                    // We have something else beside ByteBuffers to write so fallback to normal writes.
                    writeSpinCount -= doWrite0(in);
                    break;
                case 1: {
                    // Only one ByteBuf so use non-gathering write
                    // Zero length buffers are not added to nioBuffers by ChannelOutboundBuffer, so there is no need
                    // to check if the total size of all the buffers is non-zero.
                    ByteBuffer buffer = nioBuffers[0];
                    int attemptedBytes = buffer.remaining();
                    final int localWrittenBytes = ch.write(buffer);    // java的channel调用write方法
                    if (localWrittenBytes <= 0) {
                        incompleteWrite(true);
                        return;
                    }
                    adjustMaxBytesPerGatheringWrite(attemptedBytes, localWrittenBytes, maxBytesPerGatheringWrite);
                    in.removeBytes(localWrittenBytes);
                    --writeSpinCount;
                    break;
                }
                default: {
                    // Zero length buffers are not added to nioBuffers by ChannelOutboundBuffer, so there is no need
                    // to check if the total size of all the buffers is non-zero.
                    // We limit the max amount to int above so cast is safe
                    long attemptedBytes = in.nioBufferSize();
                    final long localWrittenBytes = ch.write(nioBuffers, 0, nioBufferCnt);
                    if (localWrittenBytes <= 0) {
                        incompleteWrite(true);
                        return;
                    }
                    // Casting to int is safe because we limit the total amount of data in the nioBuffers to int above.
                    adjustMaxBytesPerGatheringWrite((int) attemptedBytes, (int) localWrittenBytes,
                            maxBytesPerGatheringWrite);
                    in.removeBytes(localWrittenBytes);
                    --writeSpinCount;
                    break;
                }
            }
        } while (writeSpinCount > 0);

        incompleteWrite(writeSpinCount < 0);
    }
```

至此，出站差不多就完事了。服务内建立好Channel，会初始化Pipeline，其中包括InboundHandler和OutboundHandler，需要write数据时，从后向前找到TailContext继承AbstractChannelHandlerContext，调用内部的executor(EventExecutor)去处理写数据操作。在新线程中，从后往前找到出站的OutboundHandler，如果是MessageToMessageEncoder，在处理时先判断当前的handler是否支持处理数据，如果不支持交给下一个handler处理，如果支持调用encode方法。将处理的结果交给下一个handler作为入参接着处理，直到所有自定handler处理完成，最后由HeadContext处理flush操作，HeadContext内维护着一个NioSocketChannelUnsafe对象，用来处理不能直接给用户暴露的方法，NioSocketChannelUnsafe为NioSocketChannel的内部类，最终调用java的Channel记性write操作。完成发送数据。

之前分析的过程是从client出站来分析的，继续分析client端入站的过程，也就是client接收服务应答的数据。

上面说过，server和client建立连接后从java的角度建立了一个Channel，也知道TCP是双工的，也就是client接收server的数据也用到了原来的Channel，demo中用到了NioEventLoopGroup，这还是`java.nio.channels.Selector.selectedKeys()`来获取可读事件，进行处理。查看源码，入口为

```java
NioEventLoop
		protected void run() {
        for (;;) {
            try {
                try {
                    switch (selectStrategy.calculateStrategy(selectNowSupplier, hasTasks())) {
                    case SelectStrategy.CONTINUE:
                        continue;

                    case SelectStrategy.BUSY_WAIT:
                        // fall-through to SELECT since the busy-wait is not supported with NIO

                    case SelectStrategy.SELECT:
                        select(wakenUp.getAndSet(false));
                        if (wakenUp.get()) {
                            selector.wakeup();
                        }
                        // fall through
                    default:
                    }
                } catch (IOException e) {
                    // If we receive an IOException here its because the Selector is messed up. Let's rebuild
                    // the selector and retry. https://github.com/netty/netty/issues/8566
                    rebuildSelector0();
                    handleLoopException(e);
                    continue;
                }

                cancelledKeys = 0;
                needsToSelectAgain = false;
                final int ioRatio = this.ioRatio;
                if (ioRatio == 100) {
                    try {
                        processSelectedKeys();
                    } finally {
                        // Ensure we always run tasks.
                        runAllTasks();
                    }
                } else {
                    final long ioStartTime = System.nanoTime();
                    try {
                        processSelectedKeys();
                    } finally {
                        // Ensure we always run tasks.
                        final long ioTime = System.nanoTime() - ioStartTime;
                        runAllTasks(ioTime * (100 - ioRatio) / ioRatio);
                    }
                }
            } catch (Throwable t) {
                handleLoopException(t);
            }
            ......
        }
    }

    private void processSelectedKeys() {
        if (selectedKeys != null) {           // 这里不为空，没有也会是size为0的Set
            processSelectedKeysOptimized();
        } else {
            processSelectedKeysPlain(selector.selectedKeys());
        }
    }

    private void processSelectedKeysOptimized() {
        for (int i = 0; i < selectedKeys.size; ++i) {
            final SelectionKey k = selectedKeys.keys[i];
          ......
            if (a instanceof AbstractNioChannel) {
                processSelectedKey(k, (AbstractNioChannel) a);
            } else {
                @SuppressWarnings("unchecked")
                NioTask<SelectableChannel> task = (NioTask<SelectableChannel>) a;
                processSelectedKey(k, task);
            }
          ......
        }
    }

```

从上面可以看到selectedKeys是关键，服务就是去处理selectedKeys，查看发现`private SelectedSelectionKeySet selectedKeys;` 私有属性，也没有方法暴露给其他类，所以就是在内部进行的实例化和修改值，搜索代码也只能看见初始化的过程，没有看见有io操作时怎么把key塞进来的。在仔细看，如下代码：

```java
NioEventLoop

    NioEventLoop(NioEventLoopGroup parent, Executor executor, SelectorProvider selectorProvider,
                 SelectStrategy strategy, RejectedExecutionHandler rejectedExecutionHandler,
                 EventLoopTaskQueueFactory queueFactory) {
        ......
        provider = selectorProvider;
        final SelectorTuple selectorTuple = openSelector();
        selector = selectorTuple.selector;
        unwrappedSelector = selectorTuple.unwrappedSelector;
        selectStrategy = strategy;
    }
    private SelectorTuple openSelector() {
        final Selector unwrappedSelector;
        try {
            unwrappedSelector = provider.openSelector();
        } catch (IOException e) {
            throw new ChannelException("failed to open a new selector", e);
        }
	      ......
        Object maybeSelectorImplClass = AccessController.doPrivileged(new PrivilegedAction<Object>() {
            @Override
            public Object run() {
                try {
                    return Class.forName(
                            "sun.nio.ch.SelectorImpl",
                            false,
                            PlatformDependent.getSystemClassLoader());
                } catch (Throwable cause) {
                    return cause;
                }
            }
        });
        ......

        final Class<?> selectorImplClass = (Class<?>) maybeSelectorImplClass;
        final SelectedSelectionKeySet selectedKeySet = new SelectedSelectionKeySet();

        Object maybeException = AccessController.doPrivileged(new PrivilegedAction<Object>() {
            @Override
            public Object run() {
                try {
                    Field selectedKeysField = selectorImplClass.getDeclaredField("selectedKeys"); // 反射获取selectorImplClass的selectedKeys字段，selectorImplClass为sun.nio.ch.SelectorImpl类型
                    Field publicSelectedKeysField = selectorImplClass.getDeclaredField("publicSelectedKeys");
                  	......
                    selectedKeysField.set(unwrappedSelector, selectedKeySet);
                    publicSelectedKeysField.set(unwrappedSelector, selectedKeySet);
                    return null;
                } catch (NoSuchFieldException e) {
                    return e;
                } catch (IllegalAccessException e) {
                    return e;
                }
            }
        });

        ......
        selectedKeys = selectedKeySet;   // 赋值过程
        logger.trace("instrumented a special java.util.Set into: {}", unwrappedSelector);
        return new SelectorTuple(unwrappedSelector,
                                 new SelectedSelectionKeySetSelector(unwrappedSelector, selectedKeySet));
    }
```

在构建NioEventLoop时，调用openSelector()初始化Selector，创建SelectorImpl实例，拿到selectedKeys字段是一个HashSet重新被赋值成SelectedSelectionKeySet类型的selectedKeySet，最后selectedKeys = selectedKeySet，也就是每次有新的io操作时，就可以从selectedKeys取到SelectionKey，从中拿到attachment即NioSocketChannel继续处理

```
maybeSelectorImplClass = AccessController.doPrivileged(new PrivilegedAction<Object>() {
            @Override
            public Object run() {
                try {
                    return Class.forName(
                            "sun.nio.ch.SelectorImpl",
                            false,
                            PlatformDependent.getSystemClassLoader());
                } catch (Throwable cause) {
                    return cause;
                }
            }
        });
Class<?> selectorImplClass = (Class<?>) maybeSelectorImplClass
Field selectedKeysField = selectorImplClass.getDeclaredField("selectedKeys");
selectedKeysField.set(unwrappedSelector, selectedKeySet);
selectedKeys = selectedKeySet;


public abstract class SelectorImpl extends AbstractSelector {
    protected Set<SelectionKey> selectedKeys = new HashSet();
}
```

继续从run开始向下追，到processSelectedKey方法，之前也说过，Channel中封装了一个NioUnsafe，一些不安全的方法不能交给用户直接调用，实际类型为NioByteUnsafe为AbstractNioByteChannel内部类，在NioByteUnsafe可以拿到AbstractNioByteChannel中的pipeline，之后正式交给pipeline来处理。当前操作为read过程，即入站过程，会找到InboundHandler，从前向后的顺序来处理。至此，分析完client的入站出站过程。

```java

NioEventLoop
		private void processSelectedKey(SelectionKey k, AbstractNioChannel ch) {
        final AbstractNioChannel.NioUnsafe unsafe = ch.unsafe();
        if (!k.isValid()) {
            final EventLoop eventLoop;
            try {
                eventLoop = ch.eventLoop();
            } catch (Throwable ignored) {
                // If the channel implementation throws an exception because there is no event loop, we ignore this
                // because we are only trying to determine if ch is registered to this event loop and thus has authority
                // to close ch.
                return;
            }
            // Only close ch if ch is still registered to this EventLoop. ch could have deregistered from the event loop
            // and thus the SelectionKey could be cancelled as part of the deregistration process, but the channel is
            // still healthy and should not be closed.
            // See https://github.com/netty/netty/issues/5125
            if (eventLoop != this || eventLoop == null) {
                return;
            }
            // close the channel if the key is not valid anymore
            unsafe.close(unsafe.voidPromise());
            return;
        }

        try {
            int readyOps = k.readyOps();
            // We first need to call finishConnect() before try to trigger a read(...) or write(...) as otherwise
            // the NIO JDK channel implementation may throw a NotYetConnectedException.
            if ((readyOps & SelectionKey.OP_CONNECT) != 0) {
                // remove OP_CONNECT as otherwise Selector.select(..) will always return without blocking
                // See https://github.com/netty/netty/issues/924
                int ops = k.interestOps();
                ops &= ~SelectionKey.OP_CONNECT;
                k.interestOps(ops);

                unsafe.finishConnect();
            }

            // Process OP_WRITE first as we may be able to write some queued buffers and so free memory.
            if ((readyOps & SelectionKey.OP_WRITE) != 0) {
                // Call forceFlush which will also take care of clear the OP_WRITE once there is nothing left to write
                ch.unsafe().forceFlush();
            }

            // Also check for readOps of 0 to workaround possible JDK bug which may otherwise lead
            // to a spin loop
            if ((readyOps & (SelectionKey.OP_READ | SelectionKey.OP_ACCEPT)) != 0 || readyOps == 0) {
                unsafe.read();
            }
        } catch (CancelledKeyException ignored) {
            unsafe.close(unsafe.voidPromise());
        }
    }
```





https://www.jianshu.com/p/b9162352073b    《Netty系列四》- Server端childHandler如何绑定到SocketChannel？

