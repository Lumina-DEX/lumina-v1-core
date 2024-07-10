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