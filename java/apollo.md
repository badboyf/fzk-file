http://www.iocoder.cn/categories/Apollo/
https://github.com/ctripcorp/apollo-use-cases
https://github.com/ctripcorp/apollo/wiki



# 问题：

## 1.apollo初始化时怎么把配置拉取回来

## 2.配置中心与本地配置，哪个优先级高

## 3.配置修改怎么触发bean属性刷新

精华文章

```
https://www.jianshu.com/p/9b9cffc1e8c3、
配置文件拉取地址 http://<服务器ip+端口>/configs/100067/default/column?ip=<本地ip>
```

# 入口 spring.factories

```
  apollo-client  spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
com.ctrip.framework.apollo.spring.boot.ApolloAutoConfiguration
org.springframework.context.ApplicationContextInitializer=\
com.ctrip.framework.apollo.spring.boot.ApolloApplicationContextInitializer
org.springframework.boot.env.EnvironmentPostProcessor=\
com.ctrip.framework.apollo.spring.boot.ApolloApplicationContextInitializer
```

## ApolloApplicationContextInitializer

```
prepareContext(context, environment, listeners, applicationArguments, printedBanner);
applyInitializers(context);
initializer.initialize(context);    ApolloApplicationContextInitializer
```

```
  public void initialize(ConfigurableApplicationContext context) {
    ConfigurableEnvironment environment = context.getEnvironment();
    String enabled = environment.getProperty(PropertySourcesConstants.APOLLO_BOOTSTRAP_ENABLED, "false");  // 判断apollo.bootstrap.enabled，如果为true，配置中心的文件会覆盖本地文件
    if (!Boolean.valueOf(enabled)) {
      logger.debug("Apollo bootstrap config is not enabled for context {}, see property: ${{}}", context, PropertySourcesConstants.APOLLO_BOOTSTRAP_ENABLED);
      return;
    }
    logger.debug("Apollo bootstrap config is enabled for context {}", context);

    initialize(environment);
  }
```

## 拉取配置文件

调用栈

```
SpringApplication.prepareEnvironment
SpringApplicationRunListeners.environmentPrepared
EventPublishingRunListener.environmentPrepared
SimpleApplicationEventMulticaster.multicastEvent
SimpleApplicationEventMulticaster.multicastEvent
SimpleApplicationEventMulticaster.invokeListener
SimpleApplicationEventMulticaster.doInvokeListener
ConfigFileApplicationListener.onApplicationEvent
ConfigFileApplicationListener.onApplicationEnvironmentPreparedEvent
ApolloApplicationContextInitializer.postProcessEnvironment
ApolloApplicationContextInitializer.initialize
ConfigService.getConfig
DefaultConfigManager.getConfig
DefaultConfigFactory.create
DefaultConfigFactory.createLocalConfigRepository

RemoteConfigRepository.trySync();
RemoteConfigRepository.loadApolloConfig();
  HttpResponse<ApolloConfig> response = m_httpUtil.doGet(request, ApolloConfig.class);

```

在prepareEnvironment阶段，发布ApplicationEnvironmentPreparedEvent，ConfigFileApplicationListener监听事件调用内部的EnvironmentPostProcessor扩展Environment，其中一个为ApolloApplicationContextInitializer，它的生效配置在spring.factories的org.springframework.boot.env.EnvironmentPostProcessor=com.ctrip.framework.apollo.spring.boot.ApolloApplicationContextInitializer，处理的时候调用initialize方法生成CompositePropertySource[name=ApolloBootstrapPropertySources]添加到第一个PropertySources中。同时也可以看到ApolloApplicationContextInitializer既是EnvironmentPostProcessor也是ApplicationContextInitializer。EnvironmentPostProcessor的作用是动态扩展environment，ApplicationContextInitializer的作用是扩展ConfigurableApplicationContext。

```java
	private void onApplicationEnvironmentPreparedEvent(ApplicationEnvironmentPreparedEvent event) {
		List<EnvironmentPostProcessor> postProcessors = loadPostProcessors();
		postProcessors.add(this);
		AnnotationAwareOrderComparator.sort(postProcessors);
		for (EnvironmentPostProcessor postProcessor : postProcessors) {
			postProcessor.postProcessEnvironment(event.getEnvironment(), event.getSpringApplication());
		}
	}
```

ApplicationContextInitializer的调用时机是prepareContext阶段

```
SpringApplication.prepareContext
SpringApplication.applyInitializers
ApolloApplicationContextInitializer.initialize
```

```
SpringApplication
	private void prepareContext(ConfigurableApplicationContext context, ConfigurableEnvironment environment,
			SpringApplicationRunListeners listeners, ApplicationArguments applicationArguments, Banner printedBanner) {
		context.setEnvironment(environment);
		postProcessApplicationContext(context);
		applyInitializers(context);
......
	}
	protected void applyInitializers(ConfigurableApplicationContext context) {
		for (ApplicationContextInitializer initializer : getInitializers()) {
			Class<?> requiredType = GenericTypeResolver.resolveTypeArgument(initializer.getClass(),
					ApplicationContextInitializer.class);
			Assert.isInstanceOf(requiredType, context, "Unable to call initializer.");
			initializer.initialize(context);
		}
	}
```

在详细看一下ApolloApplicationContextInitializer

```java
	@Override
  public void initialize(ConfigurableApplicationContext context) {
    ConfigurableEnvironment environment = context.getEnvironment();

    String enabled = environment.getProperty(PropertySourcesConstants.APOLLO_BOOTSTRAP_ENABLED, "false");  // apollo.bootstrap.enabled
    if (!Boolean.valueOf(enabled)) {
      logger.debug("Apollo bootstrap config is not enabled for context {}, see property: ${{}}", context, PropertySourcesConstants.APOLLO_BOOTSTRAP_ENABLED);
      return;
    }
    logger.debug("Apollo bootstrap config is enabled for context {}", context);

    initialize(environment);
  }
	@Override
  public void postProcessEnvironment(ConfigurableEnvironment configurableEnvironment, SpringApplication springApplication) {

    // should always initialize system properties like app.id in the first place
    initializeSystemProperty(configurableEnvironment);

    Boolean eagerLoadEnabled = configurableEnvironment.getProperty(PropertySourcesConstants.APOLLO_BOOTSTRAP_EAGER_LOAD_ENABLED, Boolean.class, false);  // apollo.bootstrap.eagerLoad.enabled

    //EnvironmentPostProcessor should not be triggered if you don't want Apollo Loading before Logging System Initialization
    if (!eagerLoadEnabled) {
      return;
    }

    Boolean bootstrapEnabled = configurableEnvironment.getProperty(PropertySourcesConstants.APOLLO_BOOTSTRAP_ENABLED, Boolean.class, false); // apollo.bootstrap.enabled

    if (bootstrapEnabled) {
      initialize(configurableEnvironment);
    }

  }
```

上述说的是apollo.bootstrap.enabled=true的基础上，

在看为什么Apollo 的配置为什么优先于配置文件。在environment.getProperty()方法跟踪，

```java
AbstractEnvironment
	@Override
	public <T> T getProperty(String key, Class<T> targetType, T defaultValue) {
		return this.propertyResolver.getProperty(key, targetType, defaultValue);
	}
AbstractPropertyResolver
	@Override
	public <T> T getProperty(String key, Class<T> targetType, T defaultValue) {
		T value = getProperty(key, targetType);
		return (value != null ? value : defaultValue);
	}
PropertySourcesPropertyResolver
	@Override
	@Nullable
	public <T> T getProperty(String key, Class<T> targetValueType) {
		return getProperty(key, targetValueType, true);
	}
	@Nullable
	protected <T> T getProperty(String key, Class<T> targetValueType, boolean resolveNestedPlaceholders) {
		if (this.propertySources != null) {
			for (PropertySource<?> propertySource : this.propertySources) {
				if (logger.isTraceEnabled()) {
					logger.trace("Searching for key '" + key + "' in PropertySource '" +
							propertySource.getName() + "'");
				}
				Object value = propertySource.getProperty(key);
				if (value != null) {
					if (resolveNestedPlaceholders && value instanceof String) {
						value = resolveNestedPlaceholders((String) value);
					}
					logKeyFound(key, propertySource, value);
					return convertValueIfNecessary(value, targetValueType);
				}
			}
		}
		if (logger.isTraceEnabled()) {
			logger.trace("Could not find key '" + key + "' in any property source");
		}
		return null;
	}
```

从propertySources开始遍历，找到key就会返回，而上面说道了，会把apollo的配置addFirst放到第一个位置上，所以，Apollo的配置优先级会高一些。

接着，继续看一下，是怎么能自动刷新配置。它的刷新配置的机制是什么？bean删掉重新初始化还是只是把相应的属性重新赋值。

在程序启动的时候，从服务器拉取配置文件缓存大本地后，还有有两个线程启动，一个是出longPolling获取配置文件，文件改变时通知，另一个是周期性拉取配置文件

```java
  public RemoteConfigRepository(String namespace) {
。。。。。。
    this.trySync();
    this.schedulePeriodicRefresh();
    this.scheduleLongPollingRefresh();
  }
```

scheduleLongPollingRefresh感知服务端发生变化时通知spring修改属性，继续跟踪

```
  private void scheduleLongPollingRefresh() {
    remoteConfigLongPollService.submit(m_namespace, this);
  }
  
RemoteConfigLongPollService
  private void startLongPolling() {
   	。。。。。。
          doLongPollingRefresh(appId, cluster, dataCenter);
		。。。。。。。
  }
  
RemoteConfigLongPollService
  private void doLongPollingRefresh(String appId, String cluster, String dataCenter) {
    final Random random = new Random();
    ServiceDTO lastServiceDto = null;
    while (!m_longPollingStopped.get() && !Thread.currentThread().isInterrupted()) {
	......
          TimeUnit.SECONDS.sleep(5);
  ......
        url =
            assembleLongPollRefreshUrl(lastServiceDto.getHomepageUrl(), appId, cluster, dataCenter,
                m_notifications); // http://<ip>:<port>/notifications/v2?cluster=?&appId=?&ip=?&notifications=%5B%7B%22namespaceName%22%3A%22column%22%2C%22notificationId%22%3A6087%7D%5D

        logger.debug("Long polling from {}", url);
        HttpRequest request = new HttpRequest(url);
        request.setReadTimeout(LONG_POLLING_READ_TIMEOUT);

        transaction.addData("Url", url);

        final HttpResponse<List<ApolloConfigNotification>> response =
            m_httpUtil.doGet(request, m_responseType);

        logger.debug("Long polling response: {}, url: {}", response.getStatusCode(), url);
        if (response.getStatusCode() == 200 && response.getBody() != null) {
          updateNotifications(response.getBody());
          updateRemoteNotifications(response.getBody());
          transaction.addData("Result", response.getBody().toString());
          notify(lastServiceDto, response.getBody());
        }

        //try to load balance
        if (response.getStatusCode() == 304 && random.nextBoolean()) {
          lastServiceDto = null;
        }

        m_longPollFailSchedulePolicyInSecond.success();
        transaction.addData("StatusCode", response.getStatusCode());
        transaction.setStatus(Transaction.SUCCESS);
      } catch (Throwable ex) {
	......
      } finally {
        transaction.complete();
      }
    }
  }
```

没抢到锁睡5s，抢到锁继续执行，向`http://<ip>:<port>/notifications/v2`发送GET请求获取配置，关键点就在这了，如果服务端没有发布配置修改，那么该线程会阻塞一段时间，状态码返回304标识没有修改，如果在阻塞阶段发布配置，请求马上返回，状态码为200，走通知的逻辑。真正的通知spring容器修改配置在`notify(lastServiceDto, response.getBody());`，继续跟踪

```java
RemoteConfigLongPollService
	private void notify(ServiceDTO lastServiceDto, List<ApolloConfigNotification> notifications) {
    ......
          remoteConfigRepository.onLongPollNotified(lastServiceDto, remoteMessages);
   ......
  }
```

委派给RemoteConfigRepository处理

```
  public void onLongPollNotified(ServiceDTO longPollNotifiedServiceDto, ApolloNotificationMessages remoteMessages) {
    m_longPollServiceDto.set(longPollNotifiedServiceDto);
    m_remoteMessages.set(remoteMessages);
    m_executorService.submit(new Runnable() {
      @Override
      public void run() {
        m_configNeedForceRefresh.set(true);
        trySync();
      }
    });
  }
```

回到了开始说的AbstractConfigRepository.trySync方法中，在sync同步时，先看之前的配置和现在的配置是否一致，如果不一致fireRepositoryChange进入修改通知逻辑, listener为LocalFileConfigRepository

```
  @Override
  protected synchronized void sync() {
   	......
      ApolloConfig current = loadApolloConfig();
      //reference equals means HTTP 304
      if (previous != current) {
        logger.debug("Remote Config refreshed!");
        m_configCache.set(current);
        this.fireRepositoryChange(m_namespace, this.getConfig());
		......
  }
  
  protected void fireRepositoryChange(String namespace, Properties newProperties) {
    for (RepositoryChangeListener listener : m_listeners) {
      try {
        listener.onRepositoryChange(namespace, newProperties);
		......
  }
```

处理本地文件时，先更新本地的缓存配置文件，在触发`fireRepositoryChange`，这次的lisnter为`DefaultConfig`，发布`ConfigChangeEvent`事件，`AutoUpdateConfigChangeListener`监听事件

```java
LocalFileConfigRepository
	@Override
  public void onRepositoryChange(String namespace, Properties newProperties) {
		......
    updateFileProperties(newFileProperties, m_upstream.getSourceType()); //更新本地的缓存配置文件
    this.fireRepositoryChange(namespace, newProperties);
  }
```

springValueRegistry存放了BeanFactory -> key -> SpringValue(哪个bean用到了该key) 的对应关系，`springValueRegistry.get(beanFactory, key);`可以获取到该类中像@Value等方式引用该key的Bean，然后`updateSpringValue(val)`真正更新属性

```java
AutoUpdateConfigChangeListener
	public void onChange(ConfigChangeEvent changeEvent) {
    Set<String> keys = changeEvent.changedKeys();
    if (CollectionUtils.isEmpty(keys)) {
      return;
    }
    for (String key : keys) {
      // 1. check whether the changed key is relevant
      Collection<SpringValue> targetValues = springValueRegistry.get(beanFactory, key);
      if (targetValues == null || targetValues.isEmpty()) {
        continue;
      }

      // 2. check whether the value is really changed or not (since spring property sources have hierarchies)
      if (!shouldTriggerAutoUpdate(changeEvent, key)) {
        continue;
      }

      // 3. update the value
      for (SpringValue val : targetValues) {
        updateSpringValue(val);
      }
    }
  }

AutoUpdateConfigChangeListener
  private void updateSpringValue(SpringValue springValue) {
		......
  		Object value = resolvePropertyValue(springValue);
      springValue.update(value);
		......
  }
```

判断是Field还是Method，可以看到如果是Field的情况，是用反射的原理把原来的属性给重新复制，所以根据这个也能看出来，如果这种配置是每次重新读取可以达到实时变更的效果，但是如果是连接池这种，根据原配置产生的连接是不会改变的。

```java

SpringValue
  public void update(Object newVal) throws IllegalAccessException, InvocationTargetException {
    if (isField()) {
      injectField(newVal);
    } else {
      injectMethod(newVal);
    }
  }

  private void injectField(Object newVal) throws IllegalAccessException {
    Object bean = beanRef.get();
    if (bean == null) {
      return;
    }
    boolean accessible = field.isAccessible();
    field.setAccessible(true);
    field.set(bean, newVal);
    field.setAccessible(accessible);
  }

  private void injectMethod(Object newVal)
      throws InvocationTargetException, IllegalAccessException {
    Object bean = beanRef.get();
    if (bean == null) {
      return;
    }
    methodParameter.getMethod().invoke(bean, newVal);
  }
```

主流程通了，在回过来看一下细节，`AutoUpdateConfigChangeListener`是由谁来设置监听`ConfigChangeEvent`事件处理变更配置的，在`PropertySourcesProcessor.initializeAutoUpdatePropertiesFeature`中，

```java
  private void initializeAutoUpdatePropertiesFeature(ConfigurableListableBeanFactory beanFactory) {
    ......
    AutoUpdateConfigChangeListener autoUpdateConfigChangeListener = new AutoUpdateConfigChangeListener(
        environment, beanFactory);

    List<ConfigPropertySource> configPropertySources = configPropertySourceFactory.getAllConfigPropertySources();
    for (ConfigPropertySource configPropertySource : configPropertySources) {
      configPropertySource.addChangeListener(autoUpdateConfigChangeListener);
    }
  }
```

 `PropertySourcesProcessor`是由`ApolloConfigRegistrar`注册的，关于`ApolloConfigChangeListener`和`ApolloConfig`注解的处理，是由`ApolloAnnotationProcessor`来处理，`ApolloAnnotationProcessor`也是在这里注册的

```java
public class ApolloConfigRegistrar implements ImportBeanDefinitionRegistrar {
  @Override
  public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
    AnnotationAttributes attributes = AnnotationAttributes.fromMap(importingClassMetadata
        .getAnnotationAttributes(EnableApolloConfig.class.getName()));
    String[] namespaces = attributes.getStringArray("value");
    int order = attributes.getNumber("order");
    PropertySourcesProcessor.addNamespaces(Lists.newArrayList(namespaces), order);

    Map<String, Object> propertySourcesPlaceholderPropertyValues = new HashMap<>();
    // to make sure the default PropertySourcesPlaceholderConfigurer's priority is higher than PropertyPlaceholderConfigurer
    propertySourcesPlaceholderPropertyValues.put("order", 0);

    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, PropertySourcesPlaceholderConfigurer.class.getName(),
        PropertySourcesPlaceholderConfigurer.class, propertySourcesPlaceholderPropertyValues);

    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, PropertySourcesProcessor.class.getName(),
        PropertySourcesProcessor.class);

    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, ApolloAnnotationProcessor.class.getName(),
        ApolloAnnotationProcessor.class);

    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, SpringValueProcessor.class.getName(), SpringValueProcessor.class);
    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, SpringValueDefinitionProcessor.class.getName(), SpringValueDefinitionProcessor.class);

    BeanRegistrationUtil.registerBeanDefinitionIfNotExists(registry, ApolloJsonValueProcessor.class.getName(),
            ApolloJsonValueProcessor.class);
  }
```

`ApolloConfigRegistrar` 由 `EnableApolloConfig` 引入

```
@Import(ApolloConfigRegistrar.class)
public @interface EnableApolloConfig
```

接下来还有一个细节，在根据key获取哪个Bean中注入了该属性的时候，SpringValueRegistry.registry是怎么初始化的。在ApolloProcessor.postProcessBeforeInitialization阶段，

```java
  public Object postProcessBeforeInitialization(Object bean, String beanName)
      throws BeansException {
    Class clazz = bean.getClass();
    for (Field field : findAllField(clazz)) {
      processField(bean, beanName, field);
    }
    for (Method method : findAllMethod(clazz)) {
      processMethod(bean, beanName, method);
    }
    return bean;
  }
```

SpringValueProcessor是ApolloProcessor的一个实现类，SpringValueProcessor由ApolloConfigRegistrar做成Bean

```
  protected void processField(Object bean, String beanName, Field field) {
		......
    for (String key : keys) {
      SpringValue springValue = new SpringValue(key, value.value(), bean, beanName, field, false);
      springValueRegistry.register(beanFactory, key, springValue);
      logger.debug("Monitoring {}", springValue);
    }
  }
```

最终调用SpringValueRegistry.register方法，

```

  public void register(BeanFactory beanFactory, String key, SpringValue springValue) {
    if (!registry.containsKey(beanFactory)) {
      synchronized (LOCK) {
        if (!registry.containsKey(beanFactory)) {
          registry.put(beanFactory, LinkedListMultimap.<String, SpringValue>create());
        }
      }
    }

    registry.get(beanFactory).put(key, springValue);

    // lazy initialize
    if (initialized.compareAndSet(false, true)) {
      initialize();
    }
  }
```

