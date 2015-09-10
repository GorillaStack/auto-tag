Thanks for the quick chat just now.
In brief – I want to get some coding done – will reference this at re:invent breakout session on cost optimization and drive people to your blog if you build this and release it (subject to Amazon PR approval on your messaging).

In detail -

At the re:invent presentation I’m doing on Cost Optimization, I want to be able to direct the attendees to some templates they can use to get going really quickly with the recommendations.

I would like to have a high quality scripts built for the following area:

1.       Lambda Auto-tagging Function (in node.js or Java)

a.       Tag resources with a Key = User, Value = Y account of Y = user / resource who launched resource

b.      Resources include:

i.      EC2 Instances

ii.      S3 Buckets

iii.      Autoscaling Groups

iv.      Subnets

v.      ELBs

vi.      EBS Volumes

vii.      Redshift Clusters

viii.      Elasticache Nodes

ix.      VPCs

x.      RDS Instances

xi.      RDS Storage volumes

xii.      Internet Gateways

xiii.      Cloudfront buckets

xiv.      Dynamo Tables

xv.      Reserved Instances (even though it won’t have any effect yet)

xvi.      Route53 resources

xvii.      EMR clusters

xviii.      Data Pipelines

xix.      SNS, SES, SQS, SWF resources (detail tbc)

c.       Keys include

i.      IAM user

ii.      Opsworks Stack (not sure if this is possible – intent is to track user who created it not just reference the fact Opsworks service did it)

iii.      Cloudformation Stack (not sure if this is possible – intent is to track user who created it not just reference the fact Opsworks service did it)

iv.      Codedeploy  (not sure if this is possible – intent is to track user who created it not just reference the fact Opsworks service did it)

d.      Works with federated IAM users (apparently in cloudtrail you can see who they are)


If you’re happy to build this for public release let me know. I know it’s a bit of work so it’s completely fine if you can’t get it done, just let me know. You should be able to get the Operations for the above by just starting each one then turning it off 5 min later and checking the DBR-rt.

Thanks
