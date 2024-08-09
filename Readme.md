## Test

override node_modules\o1js\dist\node\lib\mina\constants.js

replace cost limit to prevent from account update limit in test 

```
    //TransactionCost.COST_LIMIT = 69.45;

    TransactionCost.COST_LIMIT = 1000;
```

or by script

```
cd contracts
npm run patch
```
docker run -it   --env NETWORK_TYPE="single-node"  --env PROOF_LEVEL="full"   --env LOG_LEVEL="Info"   -p 3085:3085  -p 5433:5432  -p 8080:8080 -p 8181:8181 -p 8282:8282 o1labs/mina-local-network:master-latest-lightnet


zk lightnet start -p "full" 