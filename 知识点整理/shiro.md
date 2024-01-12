先走一波配置
```java
@Configuration
@ConditionalOnProperty(value = "config.enableShiro", havingValue = "true", matchIfMissing = true)
public class ShiroConfig {

    private static final List<String> skipPaths = Arrays.asList("/*.html", "/**/*.js", "/*.js", "/**/*.css", "/**/*.png",
            "/**/*.ttf", "/configuration/ui", "/swagger-resources/**", "/v2/api-docs", "/configuration/security", "/validatorUrl",
            "/inner/**", "/skip/**");

    @Bean
    @ConditionalOnMissingBean
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator defaultAAP = new DefaultAdvisorAutoProxyCreator();
        defaultAAP.setProxyTargetClass(true);
        return defaultAAP;
    }

    @Bean
    public UserAuthorizingRealm userAuthorizingRealm(HashedCredentialsMatcher hashedCredentialsMatcher) {
        UserAuthorizingRealm realm = new UserAuthorizingRealm();
        realm.setCredentialsMatcher(hashedCredentialsMatcher);
        return realm;
    }

    @Bean
    public SecurityManager securityManager(UserAuthorizingRealm userAuthorizingRealm, SessionManager sessionManager) {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(userAuthorizingRealm);
        securityManager.setSessionManager(sessionManager);
        return securityManager;
    }

    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean(SecurityManager securityManager) {
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        shiroFilterFactoryBean.setSecurityManager(securityManager);

        Map<String, String> map = new LinkedHashMap<>();
        for (String skipPath : skipPaths) {
            map.put(skipPath, "anon");
        }
        map.put("/logout", "logout");
        map.put("/**", "authc");
        shiroFilterFactoryBean.setLoginUrl("/login");
        shiroFilterFactoryBean.setSuccessUrl("/index");
        shiroFilterFactoryBean.setUnauthorizedUrl("/error");

        LinkedHashMap<String, Filter> filterMap = new LinkedHashMap<>();
        filterMap.put("authc", new CustomFormAuthenticationFilter());
        shiroFilterFactoryBean.setFilters(filterMap);

        shiroFilterFactoryBean.setFilterChainDefinitionMap(map);
        return shiroFilterFactoryBean;
    }


    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(SecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor = new AuthorizationAttributeSourceAdvisor();
        authorizationAttributeSourceAdvisor.setSecurityManager(securityManager);
        return authorizationAttributeSourceAdvisor;
    }
    @Bean
    public SessionManager sessionManager(){
        CustomSessionManager shiroSessionManager = new CustomSessionManager();
        shiroSessionManager.setSessionDAO(new CustomSessionDao());
        return shiroSessionManager;
    }

    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher(){
        HashedCredentialsMatcher hashedCredentialsMatcher = new HashedCredentialsMatcher();
        hashedCredentialsMatcher.setHashAlgorithmName("md5");
        hashedCredentialsMatcher.setHashIterations(Constant.HASH_TIMES);
        return hashedCredentialsMatcher;
    }
}
```
切入口为filter `ShiroFilterFactoryBean.SpringShiroFilter` 是`javax.servlet.Filter`子类，

```
SpringShiroFilter(WebSecurityManager webSecurityManager, FilterChainResolver resolver)
```
分析下关系
```java
ShiroFilterFactoryBean
  - getObject 返回的是 SpringShiroFilter
SpringShiroFilter
  - SecurityManager
    - AuthorizingRealm
    - SessionManager
    - CacheManager
```
看下登录流程

>切入就是SpringShiroFilter，
>
>- org.apache.shiro.web.servlet.OncePerRequestFilter   doFilterInternal  这个Filter是shiro的，是SpringShiroFilter的父类, 保证请求在每个servlet容器就执行一次
>- 然后先创建一个通过SpringShiroFilter里的SecurityManager创建Subject,
>  创建的过程中，需要像Subject中塞org.apache.shiro.session.Session,Session的获取通过构建WebSessionKey从SecurityManager里的SessionManager，SessionManger通过SessionDao来获取，未登录的情况下Session此时取不到
>- 构建完的Subject现在Session是null，pricipal是null
>-   准备工作完成，开始进入接口，进口进入前需执行前置的Filter，预置filter如下.最终调到接口
>- 接口里构建UsernamePasswordToken执行subject.login
>  在构建subject时，已经把SecurityManager塞进了Subject里，此时的login通过SecurityManager来执行，SecurityManager通过Authenticator去验证实际类型为ModularRealmAuthenticator，然后交给配置的Realm去校验，参数包含刚才创建的token，比较密码，如果不对抛AuthenticationException
>- 登录成功，重新创建Subject，和刚才创建Subject不一样的是这次Principals有值，会为此创建新的Session

```
anon			 			   ->  AnonymousFilter
authc			 			   ->  FormAuthenticationFilter
authcBasic			   ->  BasicHttpAuthenticationFilter
authcBearer			   ->  BearerHttpAuthenticationFilter
logout			 		   ->  LogoutFilter
noSessionCreation  ->  NoSessionCreationFilter
perms			 			   ->  PermissionsAuthorizationFilter
port			 			   ->  PortFilter
rest			 			   ->  HttpMethodPermissionFilter
roles			 			   ->  RolesAuthorizationFilter
ssl			 	 			   ->  SslFilter
user			 			   ->  UserFilter
invalidRequest	   ->  InvalidRequestFilter
```

