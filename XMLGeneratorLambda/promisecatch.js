let http = require('http');
const cluster = require('cluster');
let customCores = 3; //this will decide the no of child processes to be created


// new Promise((resolve, rej) => {
//     http.get({ host: 'www.google.com' }, (res) => {
//         console.log("res", res.statusCode);
//         if (res.statusCode != 200) rej('no google')
//         else resolve('google');
//     });
// }).then((val) => {
//     console.log("Val", val);
// }).catch((err) => {
//     console.log("Err", err);
// })

/** a Promise rejection is caught only in the catch block and not 
 * in then
 */

let testArray = [];
for (let i = 0; i < 30; i++) {
    testArray[i] = i*100;//Math.random() * 100;
}

// for (let i = 0; i < testArray.length; i++) {
//     console.log(testArray[i]);
// }

/**a promise runs everytime on account of its definition itself 
 * being a chunk of runnable code. Enclose it in a function and
 * call the functon in Promise.all([]).
 */

let funcPromise1 = ()=>{
    return new Promise((resolve, reject) => {
        for (let i = 0; i < testArray.length/2; i++) {
            new Promise((res, rej) => {
                if (testArray[i] % 2 == 0) res("done 1");
                else rej("not done 1")
            }).then((val) => {
                // console.log("in then")
            }).catch((err) => {
                // console.log("err", err)
            })
    
            resolve("all done 1");
        }
    })
} 



let funcPromise2 = ()=>{
    return new Promise((resolve, reject) => {
        for (let i = 0; i < testArray.length/2; i++) {
            new Promise((res, rej) => {
                res(testArray[i]);
            }).then((val) => {
                // console.log("in then 2")
            }).catch((err) => {
                // console.log("err 2", err)
            })
        }
        resolve("all done 2");
    })
} 

let funcPromise3 = ()=>{
    return new Promise((resolve, reject) => {
        for (let i = 0; i < testArray.length/2; i++) {
            new Promise((res, rej) => {
                if (testArray[testArray.length/2 + i] % 2 == 0){
                    console.log(testArray[testArray.length/2 + i]);
                    res("done 3");
                } 
                else rej("not done 3")
            }).then((val) => {
                // console.log("in then")
            }).catch((err) => {
                // console.log("err", err)
            })
    
            resolve("all done 3");
        }
    })
}


let funcPromise4 = ()=>{
    return new Promise((resolve, reject) => {
        for (let i = 0; i < testArray.length/2; i++) {
            new Promise((res, rej) => {
                if (testArray[testArray.length/2 + i] % 2 == 0) res("done 4");
                else rej("not done 4")
            }).then((val) => {
                // console.log("in then")
            }).catch((err) => {
                console.log("err", err)
            })
    
            resolve("all done 4");
        }
    })
} 

// Promise.all([funcPromise1, funcPromise2]).then((val) => {
//     console.log(val);
//     console.log("Promise.all works");
// })


/**CLUSTER CODE  https://nodejs.org/api/cluster.html 
 * 
 * see worker.disconnect()
*/
const os = require('os');
let numCPUS = os.cpus().length;

//--------------------------------------------------
// console.log("cpus",os.cpus().length);
console.log("numCPUS", numCPUS);

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
  
    // Fork workers.
    // for (let i = 0; i < numCPUS-8; i++) {
    //   cluster.fork();
    // }
    cluster.fork();


    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });


    // WORK TO BE DONE
    Promise.all([funcPromise1(), funcPromise2() ]).then((val) => {
        console.log(val);
        console.log("Promise.all FIRST works");
    }).catch((err)=>{
        console.log("Err in promise.all 1", err);
    })

  } else {
    // Workers can share any TCP connection
    // In this case it is an HTTP server
    
    new Promise((resolve, reject)=>{
        console.log(`Worker ${process.pid} started`);
        resolve(process.pid);
    }).then((pid)=>{
        Promise.all([funcPromise3(), funcPromise4()]).then((val) => {
            console.log(val);
            console.log("Promise.all SECOND works");
            console.log("killing worker");
            process.kill(process.pid);
        }); 
    }).catch((err)=>{
        console.log("Err in promise.all 2", err);
    })
        

    /** How to kill master and send a message to child process to stop? Also how to 
     * kill child process after it's work is done?
     * process.kill(process.pid);
     */

   
  }

/** cluster module is used to create child process. emailArray is broken into 2 parts
 * one part is handled using master and the other using child.
 * 2 promises are used, one for each url.
 * Promise.all is used in both cases, one for master and one for child as 2 apis are to be hit. 
 * 
 * child process should be killed after it's work is done. (process.kill(process.pid))
 */