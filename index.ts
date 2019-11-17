import * as pulumi from "@pulumi/pulumi";
import * as digitalocean from "@pulumi/digitalocean";
import * as aws from "@pulumi/aws";

var clustercount:number = 1; 
var clusternodes:number = 1;
var clustername:string = "capitole-cluster";
var clusterregion = digitalocean.Regions.SFO2;
var clustermachinestype = digitalocean.DropletSlugs.DropletS1VCPU2GB; 

function publicReadPolicyForBucket(bucketName: string) {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*`
            ]
        }]
    });
}

const clusterconfigbucket = new aws.s3.Bucket("clusterconfig");
const bucketPolicy = new aws.s3.BucketPolicy("my-openbar-policy", {
    bucket: clusterconfigbucket.bucket,
    policy: clusterconfigbucket.bucket.apply(publicReadPolicyForBucket)
})

var i:number;
for(i = 1;i<=clustercount;i++) {
	let clusteruniquename = clustername + '-' + i;
	let cluster = new digitalocean.KubernetesCluster(clusteruniquename,
		{
	    		region: clusterregion,
	    		version: "latest",
	    		nodePool: {
	    		    name: "default",
	    		    size: clustermachinestype,
	       		    nodeCount: clusternodes,
	    	},
	});

	console.log("Cluster " + clusteruniquename + " created !");

    	let object = new aws.s3.BucketObject(clusteruniquename, { 
      		bucket: clusterconfigbucket.bucket,
		content: cluster.kubeConfigs[0].rawConfig
    	});
}
