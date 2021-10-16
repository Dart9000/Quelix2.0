const express = require("express");
const router = express.Router();
const qr = require("qrcode");

const { auth, isLogedIn } = require('../Midlewares/auth.js');
const { getJoinedQueues } = require('../Midlewares/joinedQueues.js');

const Queue = require("../models/queue");
const User = require("../models/user");

router.get("/all", isLogedIn, (req, res) => {
  Queue.find((err, foundQueues) => {
    foundQueues.reverse();
    res.render("allQueues", {isLogedIn: req.isLogedIn, queues: foundQueues});
  });
});

router.get("/indi/:queueCode", auth, isLogedIn, (req, res) =>{
  const queueCode = req.params.queueCode;

  Queue.findOne({_id: queueCode}, (err, foundQueue) => {

    const host = req.get("host");
    const address = "https://"+host+"/queue/join/"+queueCode;

    const userPos = foundQueue.joinedUsersID.indexOf(req.user._id)+1;

    let isAdmin = false;
    if(foundQueue.adminID == req.user._id){
      isAdmin = true;

      qr.toDataURL(address, (err, src) => {
        if (err) res.send("Error occured");
        User.findOne({_id: foundQueue.joinedUsersID[0]}, (err, foundUser) => {
          let nexTurn = 'No one has Joined the Queue';
          if(foundUser){
            nexTurn = foundUser.name;
          }
          res.render("indiQueue", {isLogedIn: req.isLogedIn, queue: foundQueue, userPos: userPos, isAdmin: isAdmin, nexTurn: nexTurn, qrUrl: src});
        });
      });

    }else{
      res.render("indiQueue", {isLogedIn: req.isLogedIn, queue: foundQueue, userPos: userPos, isAdmin: isAdmin});
    }

  });
});

router.get("/created", auth, isLogedIn, (req, res) =>{
  Queue.find({adminID: req.user._id}, (err, foundQueues) => {
    foundQueues.reverse();
    res.render("myQueues", {isLogedIn: req.isLogedIn, queues: foundQueues, forWhat: "created"});
  });
});

router.get("/", auth, isLogedIn, getJoinedQueues, (req, res) => {

  req.joinedQueues.reverse();
  res.render("myQueues", {isLogedIn: req.isLogedIn, queues: req.joinedQueues, forWhat: "joined"});

});

router.get("/create", auth, isLogedIn, (req, res) => {
  res.render("createQueue", {isLogedIn: req.isLogedIn});
});

router.post("/create", (req, res) => {
  const newQueue = new Queue({
    adminID: req.user._id,
    adminName: req.user.name,
    title: req.body.queueName,
    maxLimit: req.body.maxLimit,
    joinedUsersID: []
  });

  newQueue.save((err) => {
    if(err){
      console.log(err);
    }else{
      res.redirect("/queue/created");
    }
  });
});

router.get("/join", auth, isLogedIn, (req, res) => {
  res.render("joinQueue", {isLogedIn: req.isLogedIn})
});

router.get("/join/:queueCode", auth, (req, res) => {
  const queueCode = req.params.queueCode;

  Queue.findOne({_id: queueCode}, (err, foundQueue) => {

    if(foundQueue.joinedUsersID.length !== foundQueue.maxLimit){

      if(foundQueue.joinedUsersID.indexOf(req.user._id) == -1){
        foundQueue.joinedUsersID.push(req.user._id);
        foundQueue.save((err) => {
          if(err){
            console.log(err);
          }else{
            res.redirect("/queue/indi/"+foundQueue._id);
          }
        });
      }else{
        if(foundQueue.joinedUsersID[0] == req.user._id){
          foundQueue.joinedUsersID.shift();
          foundQueue.save();
          res.render("checkIn", {isLogedIn: req.isLogedIn, userName: req.user.name});
        }else{
          res.send("Its not your turn");
        }
      }

    }else{
      res.send("Queue is Full");
    }
  });
});

router.post("/join", (req, res) => {
  const queueCode = req.body.queueCode;

  Queue.findOne({_id: queueCode}, (err, foundQueue) => {

    if(foundQueue.joinedUsersID.length !== foundQueue.maxLimit){

      if(foundQueue.joinedUsersID.indexOf(req.user._id) == -1){
        foundQueue.joinedUsersID.push(req.user._id);
        foundQueue.save((err) => {
          if(err){
            console.log(err);
          }else{
            res.redirect("/queue/indi/"+foundQueue._id)
          }
        });
      }else{
        res.send("You are already in the queue");
      }

    }else{
      res.send("Queue is Full");
    }
  });
});

router.post("/checkIn", (req, res) => {
  const queueCode = req.body.queueCode;

  Queue.findOne({_id: queueCode}, (err, foundQueue) => {
    if(foundQueue.joinedUsersID[0] == req.user._id){
      foundQueue.joinedUsersID.shift();
      foundQueue.save();
      res.render("checkIn", {isLogedIn: req.isLogedIn, userName: req.user.name});
    }else{
      res.send("Its not your turn");
    }
  });
});

router.post("/delete", (req, res) => {
  const queueCode = req.body.queueCode;

  Queue.findOneAndDelete({_id: queueCode}, (err, docs) => {
    res.redirect("/queue/created");
  });
});


router.get("/data/:queueCode", auth, (req, res) => {
  const queueCode = req.params.queueCode;

  Queue.findOne({_id: queueCode}, (err, foundQueue) => {
    const userPos = foundQueue.joinedUsersID.indexOf(req.user._id)+1;
    User.findOne({_id: foundQueue.joinedUsersID[0]}, (err, foundUser) => {
      let nexTurn = 'No one has Joined the Queue';
      if(foundUser){
        nexTurn = foundUser.name;
      }
      res.json({queueLength: foundQueue.joinedUsersID.length, nexTurn: nexTurn, userPos: userPos});
    });
  });
});

module.exports = router;
