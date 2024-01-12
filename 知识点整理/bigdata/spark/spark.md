#### stage

宽依赖  窄依赖
**区分宽窄依赖主要就是看父RDD的一个Partition的流向，要是流向一个的话就是窄依赖，流向多个的话就是宽依赖**

Spark任务会根据**RDD之间的依赖关系，形成一个DAG有向无环图**，DAG会提交给DAGScheduler，DAGScheduler会把DAG划分相互依赖的多个stage，划分stage的依据就是RDD之间的宽窄依赖。**遇到宽依赖就划分stage**,每个stage包含一个或多个task任务。然后将这些task以taskSet的形式提交给**TaskScheduler运行**。   **stage是由一组并行的task组成。



map和mapValues的不通：map里有分区器，mapValues不会进行分区

涉及到的端口  4040 8080 18080