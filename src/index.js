import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import * as THREE from "three";
import $ from "jquery";
import React, { Component } from "react";
import roughnessmap from "./images/Plastic_001_ROUGH2.jpg";
import anime from "animejs/lib/anime.es.js";
// import replyimage from "./images/noun_Reply_70802.png";
import starimage from "./images/images.jpeg";
import starimagealpha from "./images/imagesalpha.png";
import globeimage from "./images/globe3.svg";
import smileyimage from "./images/smiley.svg";
// import smileyimage from "./images/rose-2-2015042038.svg"
import accountimage from "./images/account2.svg";
import stickerbg from "./images/stickerbg.png";
import envmap from "./images/envmap.jpg";
import envmap2 from "./images/envmap2.jpg";
import scratchmap from "./images/scratchtexture.jpg";
import papermap from "./images/paper.jpeg";
import papermap2 from "./images/paper.jpg";
import starbutton from "./images/8-Point-Star_black_void.svg"
import holographicmap from "./images/MWHG50-XLARGE.jpg";
import { SpotLight, MeshNormalMaterial, TorusKnotBufferGeometry } from "three";
import { FresnelShader } from "./shaders/FresnelShader.js";
import { Cloudinary } from "cloudinary-core"; // If your code is for ES6 or higher
import firebase from "firebase";
import { Interaction } from "three.interaction";
// import Canvas from './canvas';
import CanvasDraw from "react-canvas-draw";
import SignatureCanvas from 'react-signature-canvas'
import Hamburger from 'hamburger-react'


import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import scenedata from "./models/daisy.glb";

const type = {reply : "reply", sticker : "sticker", feedphoto : "feedphoto", newphoto: "newphoto"}
const animationType = {fromright:"fromright", fromleft:"fromleft", fromabove:"fromabove"}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera()
var imagewidth = 2;
var feedheight = 0;
var bottomoffeed = 0;
var photozposition = 0.75;
console.log("Window width");

var photos = [];
var currentPhotosList = []
var photoDataByKey = {}
var currentPage = 0
var replies = {};

var areRepliesVisible = {};
var yRepliesDifferential = {};
var replyLine = {};
var replyMeshes = {};

var stickers = []
var stickerIndex = 0
var stickerCount = 0
var stickerMesh = undefined

var backDicts = []
const transitionTime = 500

var followingList = {}
var firstLoad = true

var primaryorange = "FDB943";
var primarywhite = "E6E3DA";
var primarydarkorange = "fe5b30"
var primarydarkpink = "fe5b30"

console.log(window.innerWidth);
if (window.innerWidth < 737) {
  imagewidth = 1.8;
}

var textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "Anonymous";

var grimetexture = undefined
var paperTexture = undefined
var starObject = createStarObject()

var photoGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 0.000001))
// var sticker = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 0.000001));

function getGrimeTexture() {


  return new Promise(resolve => {
    textureLoader.load(roughnessmap, function (texture) {
      grimetexture = texture
      resolve(texture)
    });
  })
};

async function assignGrimeTexture(cube) {
  if (grimetexture === undefined) {
    getGrimeTexture().then(function() {
      cube.material.roughnessMap = grimetexture
      cube.material.needsUpdate = true
    })
  } else {
    cube.material.roughnessMap = grimetexture
    cube.material.needsUpdate = true
  } 
}

function getPaperTexture() {


  return new Promise(resolve => {
    textureLoader.load(papermap, function (texture) {
      paperTexture = texture
      resolve(texture)
    });
  })
};

async function assignPaperTexture(cube) {
  if (paperTexture === undefined) {
    getPaperTexture().then(function() {
      cube.material.normalMap = paperTexture
      cube.material.needsUpdate = true
    })
  } else {
    cube.material.normalMap = paperTexture
    cube.material.needsUpdate = true
  } 
}

var daisy = new THREE.Mesh();

var firebaseConfig = {
  apiKey: "AIzaSyAaVRDb7lnaSSVAKfq8aYZ_KuGhhmMyA28",
  authDomain: "sunshine-c9025.firebaseapp.com",
  databaseURL: "https://sunshine-c9025.firebaseio.com",
  projectId: "sunshine-c9025",
  storageBucket: "sunshine-c9025.appspot.com",
  messagingSenderId: "182239551587",
  appId: "1:182239551587:web:0f69153c66050e45559856",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log("AUTH STATE CHANGED");
    console.log(user);
    if (!user.isAnonymous) {
      var timeref = firebase.database().ref('stickerusers/' + user.uid + '/time')
      timeref.set(Date.now())
      console.log("SETTING TIME")
      makeFollowingListeners(user.uid)
    }
    // ...
  } else {
    // User is signed out.
    // ...
    followingList = {}

    firebase
      .auth()
      .signInAnonymously()
      .catch(function (error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log(errorMessage);
      });
  }
  // ...
});

//firebase.auth().signOut();

var cl = new Cloudinary({
  cloud_name: "cathedralapp",
  secure: true,
  api_key: "485812499374832",
  api_secret: "_6igNEblFUeNDo6rMajgIpOH0BU",
});

// document.getElementById("shinebutton").onclick = function () {};
function getFollowing(uid) {  
  return new Promise(resolve => {
    const followingRef = firebase.database().ref('/following/' + uid)
    followingRef.once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      followingList[snapshot.key] = true
    })
    resolve(true)
  })
  })

}
function makeFollowingListeners(uid) {
  const followingRef = firebase.database().ref('/following/' + uid)
  followingRef.on('child_added', function(snapshot) {
      followingList[snapshot.key] = true
      console.log("FOLLOWING " + snapshot.key)
  }
  )
  followingRef.on('child_removed', function(snapshot) {
    followingList[snapshot.key] = false
    console.log("FOLLOWING " + snapshot.key)
})
}

function displayLoginForm() {
  anime({
    targets: ".logindialog",
    top: [{ value: "50%", easing: "easeInOutQuad", duration: 600 }],
  });
}

function cancelLoginForm() {
  anime({
    targets: ".logindialog",
    top: [{ value: "200%", easing: "easeInOutQuad", duration: 600 }],
  });
}

function successLoginForm() {
  anime({
    targets: ".logindialog",
    top: [{ value: "-200%", easing: "easeInOutQuad", duration: 600 }],
    delay: 500
  });
  // submitFilesinFileInput();
}

// document.getElementById("title").onclick = function (event) {
//   signOut()
// }

function signOut() {
  firebase.auth().signOut()
  console.log("signed out")
}

function submitFilesinFileInput() {
  if (document.getElementById("file-input").files) {
    let img = new Image();
    img.src = window.URL.createObjectURL(
      document.getElementById("file-input").files[0]
    );

    img.onload = () => {
      //alert(img.width + " " + img.height);
      uploadFile(
        document.getElementById("file-input").files[0],
        img.width,
        img.height,
        "testimages"
      );
    };
  }
}

function handlePhotoUpload(element) {
  if (element.files.length > 0 ) {
    let img = new Image();
    img.src = window.URL.createObjectURL(
      element.files[0]
    );
    img.onload = () => {
      uploadFile(
        element.files[0],
        img.width,
        img.height,
        "testimages/",
        false
      );
    };
  }
}

// document.getElementById("file-input").onchange = function (event) {
function submitOnChange(element, event) {
  console.log("changed");

  if (element.files.length === 0) {
    return;
  }

  var reader = new FileReader();

  // reader.onload = function (e) {
  //   $("#loginimage").attr("src", e.target.result);
  // };

  reader.readAsDataURL(element.files[0]);

  console.log(element.files[0]);

  if (firebase.auth().currentUser.isAnonymous === true ) {
    displayLoginForm();
  } else {
    handlePhotoUpload(element)
  }
};

var replyref = "";

// document.getElementById("reply-input").onchange = function (event) {
function replyOnChange(element, event) {
  console.log("changed");
  console.log(element.files[0]);

  if (firebase.auth().currentUser.isAnonymous === true ) {
    displayLoginForm();
  } else {
    handleReplyUpload(element)
  }
};

function handleReplyUpload(element) {

  if (element.files.length > 0) {
    let img = new Image();
    img.src = window.URL.createObjectURL(
      element.files[0]
    );
    img.onload = () => {
      uploadFile(
        element.files[0],
        img.width,
        img.height,
        "testimages/" + replyref + "/replies",
        true,
        replyref
      );
    };
  }
}

function uploadFile(file, width, height, firebaseref, reply, replyImageUid) {

  if (reply == true) {
    var originalphoto = scene.getObjectByName(replyref);
    originalphoto.canClick = false
  }
  var url = `https://api.cloudinary.com/v1_1/cathedralapp/upload`;
  var xhr = new XMLHttpRequest();
  var fd = new FormData();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

  // Reset the upload progress bar
  document.getElementById("progress").style.width = 0;
  document.getElementById("progress").style.opacity = 1;

  // Update progress (can be used to show progress indicator)
  xhr.upload.addEventListener("progress", function (e) {
    var progress = Math.round((e.loaded * 100.0) / e.total);
    document.getElementById("progress").style.width = progress + "%";

    console.log(`fileuploadprogress data.loaded: ${e.loaded},
  data.total: ${e.total}`);
  });

  xhr.onreadystatechange = function (e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // File uploaded successfully
      var response = JSON.parse(xhr.responseText);

      anime({
        targets: ".progress",
        opacity: [{ value: 0, easing: "easeInOutQuad", duration: 600 }],
      });

      // https://res.cloudinary.com/cloudName/image/upload/v1483481128/public_id.jpg
      var url = response.secure_url;
      console.log(url);

      const photosRef = firebase.database().ref(firebaseref);
      const newPhoto = {
        url: url,
        width: width,
        height: height,
        creator: firebase.auth().currentUser.uid,
        creatorusername: firebase.auth().currentUser.displayName,
        timestamp: Date.now()
      };

      if (reply === false) {
        var newphotoreference = photosRef.push(newPhoto).then((reference) => {
          //ref.child(snapshot.key).update({"id": snapshot.key})
          reference.once("value", function (snapshot) {
            console.log(snapshot.val());
            var photodata = snapshot.val();

            sortPhotosByYPosition(photos);

            console.log(photos[photos.length - 1]);

            var topphotoheight = 0;

            for (var [i, value] of photos.entries()) {
              const index = i + 1;

              if (photos[photos.length - index].name != "") {
                topphotoheight = photos[photos.length - index].scale.y / 2;
                break;
              }
            }

            var heighttodescend =
              (imagewidth * (photodata.height / photodata.width)) / 2 +
              0.5 +
              topphotoheight;

            for (var photo of photos) {
              anime({
                targets: photo.position,
                y: [
                  {
                    value: photo.position.y - heighttodescend,
                    easing: "easeInOutQuad",
                    duration: 750,
                  },
                ],
              });
            }

            photodata.key = snapshot.key;

            var newphoto = createPhoto(
              photodata.url, 0, 0,
              // -5,
              // 3,
              photodata.creatorusername,
              photodata,
              type.newphoto,
              animationType.fromleft
            );

            scrollToTop();
          });
        });
      } else {
        //Reply action

        var originalphoto = scene.getObjectByName(replyref);
        originalphoto.canClick = true

        var newphotoreference = photosRef.push(newPhoto).then((reference) => {
          //ref.child(snapshot.key).update({"id": snapshot.key})
          reference.once("value", function (snapshot) {
            console.log(snapshot.val());
            var photodata = snapshot.val();

            if(photoDataByKey[replyImageUid].creator !== firebase.auth().currentUser.uid) {

              createNotification(photoDataByKey[replyImageUid].creator,  photoDataByKey[replyImageUid].creatorusername, firebase.auth().currentUser.uid, firebase.auth().currentUser.displayName, replyImageUid, photoDataByKey[replyImageUid].url, "reply")
              //createNotification(photoDataByKey[replyImageUid].creator, photoDataByKey[replyImageUid].creatorusername, photoDataByKey[replyImageUid].creator, firebase.auth().currentUser.uid, firebase.auth().currentUser.displayName, replyImageUid, photoDataByKey[replyImageUid].url, "reply")
            
            }

            createAlsoNotifications(photoDataByKey[replyImageUid].creator,  photoDataByKey[replyImageUid].creatorusername, firebase.auth().currentUser.uid, firebase.auth().currentUser.displayName, replyImageUid, photoDataByKey[replyImageUid].url, "reply")


            //Reply animation
            sortPhotosByYPosition(photos);

            var heighttodescend =
              imagewidth * (photodata.height / photodata.width) + 0.5;

            for (var photo of photos) {
              if (photo.position.y < originalphoto.position.y - 0.001) {
                anime({
                  targets: photo.position,
                  y: [
                    {
                      value: photo.position.y - heighttodescend,
                      easing: "easeInOutQuad",
                      duration: 750,
                    },
                  ],
                });
              }
            }

            var replyx = 0.1;
            var replyy =
              originalphoto.position.y -
              originalphoto.scale.y / 2 -
              (imagewidth * (photodata.height / photodata.width)) / 2 -
              0.5;

            var newphoto = createPhoto(
              photodata.url,
              replyx,
              replyy,
              photodata.creatorusername,
              photodata,
              type.newreply,
              animationType.fromright
            );

            photodata.object = newphoto;
            if (replies[replyref]) {
              var previousreplies = replies[replyref];
              replies[replyref] = {};

              replies[replyref][snapshot.key] = photodata;

              for (var key in previousreplies) {
                replies[replyref][key] = previousreplies[key];
              }
              console.log(replies[replyref]);
            } else {
              replies[replyref] = {};
              replies[replyref][snapshot.key] = photodata;
              console.log(replies[replyref]);
            }

            yRepliesDifferential[replyref] =
              yRepliesDifferential[replyref] - heighttodescend;

            const startingyvalue = originalphoto.scale.y / 2;
            var yvalue = originalphoto.position.y - startingyvalue;
            var midpoints = [];

            Object.entries(replies[replyref]).forEach(([key, value], index) => {
              if (yvalue < startingyvalue) {
                yvalue = yvalue - 0.5;
                yvalue =
                  yvalue - (imagewidth * (value.height / value.width)) / 2;
              }

              midpoints.push(yvalue - originalphoto.position.y);

              yvalue = yvalue - (imagewidth * (value.height / value.width)) / 2;
            });

            if (replyLine[originalphoto.name]) {
              var originalReplyLine = replyLine[originalphoto.name];

              originalReplyLine.scale.x = 0;

              anime({
                targets: originalReplyLine.material,
                opacity: [
                  {
                    value: 0,
                    easing: "easeInOutQuad",
                    duration: 200,
                  },
                ],
                complete: function () {
                  scene.remove(originalReplyLine);
                },
              });
            }

            drawReplyLine(0, midpoints, originalphoto);
          });
        });
      }

      //var newphoto = createPhoto(url, -10, 5, firebase.auth().currentUser.displayName, ,true)
    }
  };

  fd.append("upload_preset", "sunshine");
  fd.append("tags", "browser_upload"); // Optional - add tag for image admin in Cloudinary
  fd.append("file", file);
  xhr.send(fd);
}

function createAlsoNotifications(receiverUid, originalCreatorDisplay, creatorUid, creatorDisplayName, photoUid, photoUrl, type) {
  var repliesRef = firebase.database().ref('/testimages/' + photoUid + '/replies')
  

  repliesRef.once('value', function(snapshot) {

    var replyDict = {}

    snapshot.forEach(function(childSnapshot) {

      if (childSnapshot.val().creator !== receiverUid && childSnapshot.val().creator !== creatorUid) {
        replyDict[childSnapshot.val().creator] = childSnapshot.val()
      }

    })

    for (const [key, value] of Object.entries(replyDict)) {

      console.log("Also receiver " + key)
      createNotification(key, originalCreatorDisplay, creatorUid, creatorDisplayName, photoUid, photoUrl, "also")    }

  })
}

function createNotification(receiverUid, originalCreatorDisplay, creatorUid, creatorDisplayName, photoUid, photoUrl, type) {
  const notificationRef = firebase.database().ref('/notifications/' + receiverUid)

  const urlSplit = photoUrl.split("/upload/")
  const photoStub = urlSplit[0] + "/upload/t_media_lib_thumb/" + urlSplit[1]

  var notification = {
    'receiverUid': receiverUid,
    'creatorUid':creatorUid,
    'originalCreatorDisplay':originalCreatorDisplay,
    'creatorDisplayName':creatorDisplayName,
    'photoUid':photoUid,
    'photoUrl':photoStub,
    'type':type,
    'status':'unread',
    'timestamp': Date.now()
  }
  // https://res.cloudinary.com/cathedralapp/image/upload/t_media_lib_thumb/v1605748082/sunshine/d9tvpfjhgobvfxbgienq.jpg
  // https://res.cloudinary.com/cathedralapp/image/upload/v1605748082/sunshine/d9tvpfjhgobvfxbgienq.jpg

  notificationRef.push(notification)
}

async function requestLatestStickerUsers() {
  firebase
  .database()
  .ref("stickerusers")
  .orderByChild('time')
  .limitToLast(10)
  .once("value")
  .then(function (snapshot) {
    stickers = []
    snapshot.forEach( function(childSnapshot) {
      console.log("Sticker " + childSnapshot.val())
      if (childSnapshot.val().stickerimage) {
        stickers.push(childSnapshot.val())
      }
    })
    console.log(stickers)
    shuffleArray(stickers)
    return Promise.resolve(stickers)
  })

}

async function requestSinglePhoto(uid) {
  clearFeed()

  console.log(uid)

  firebase.database().ref('/testimages/').child(uid)
    .once("value")
    .then(function (snapshot) {
      console.log(snapshot);

      var childData = snapshot.val()
      childData["key"] = snapshot.key;

      var photosList = [childData]
      // var photosList = [];

      // snapshot.forEach(function (childSnapshot) {
      //   var childKey = childSnapshot.key;
      //   console.log(childKey);
      //   var childData = childSnapshot.val();
      //   console.log(childData);
      //   // ...
      //   childData["key"] = childKey;
      //   photosList.push(childData);
      // });

      //   photosList.reverse();
        setUpNewFeed(photosList, undefined, animationType.fromright, 0)
      })
}

async function requestUserPhotos(uid) {
  clearFeed()

  console.log(uid)

  firebase.database().ref('/testimages/').orderByChild('creator').equalTo(uid)
    .once("value")
    .then(function (snapshot) {
      console.log(snapshot);

      var photosList = [];

      snapshot.forEach(function (childSnapshot) {
        var childKey = childSnapshot.key;
        console.log(childKey);
        var childData = childSnapshot.val();
        console.log(childData);
        // ...
        childData["key"] = childKey;
        photosList.push(childData);
      });

        photosList.reverse();
        setUpNewFeed(photosList, undefined, animationType.fromright, 0)
      })
}

async function requestLatestPhotos() {

  stickers = await requestLatestStickerUsers()
  console.log("Stickers promise " + stickers)
  clearFeed()

  firebase
    .database()
    .ref("testimages")
    .limitToLast(60)
    .once("value")
    .then(function (snapshot) {
      console.log(snapshot);

      var photosList = [];

      snapshot.forEach(function (childSnapshot) {
        var childKey = childSnapshot.key;
        console.log(childKey);
        var childData = childSnapshot.val();
        console.log(childData);
        // ...
        childData["key"] = childKey;
        photosList.push(childData);
      });

        photosList.reverse();
        setUpNewFeed(photosList, stickers, animationType.fromleft)
      })
      
      
      // currentPhotosList = photosList

      // currentPage = 0
      // generateFeed(paginateArray(currentPhotosList,20,currentPage));
}

function setUpNewFeed(photosList, stickers, feedAnimationType, scrollSet) {
  currentPhotosList = photosList
  currentPage = 0

  if (scrollSet === undefined) {
    scrollToTop() 
  } else {
    window.scrollTo(0,scrollSet)
  }

  generateFeed(paginateArray(currentPhotosList,20,currentPage), stickers, feedAnimationType);
}

function clearFeed() {
  for(var photo of photos) {

    for (var child in photo.children) {
      if (child.geometry != null) {
        child.geometry.dispose()
      }
      try {
        child.material.map.dispose()
      } catch {}
      try {
        child.material.roughnessMap.dispose()
      } catch {}
      try {
        child.material.normalMap.dispose()
      } catch {}
      try {
        child.material.dispose()
      } catch {}
    }

    photo.geometry.dispose()
    if (photo.material.map != null) {
      photo.material.map.dispose()
    }
    try {
      photo.material.roughnessMap.dispose()
    } catch {}
    try {
      photo.material.normalMap.dispose()
    } catch {}
    if (photo.material.map != null) {
      photo.material.map.dispose()
    }
    photo.material.dispose()
    scene.remove(photo, photo.children)

  }

  replies = {};
   photos = [];
   stickers = []

  areRepliesVisible = {};
  yRepliesDifferential = {};
  replyLine = {};
   replyMeshes = {};
   stickerIndex = 0
   stickerCount = 0
   var stickerLeft = true
  var stickerRandomIndex = anime.random(2, 8)
}

function requestPrivateFeed() {

  clearFeed()
  
  var photosList = []

  firebase.database().ref('/privatefeeds/' + firebase.auth().currentUser.uid).limitToLast(60)
  .once("value")
  .then(function (snapshot) {
    console.log(snapshot);

    var photosList = [];
    var firebaseCount = 0
    var snapshotLength = 0

    snapshot.forEach(function () {
      snapshotLength += 1
    })

    console.log("Snapshot length")
    console.log(snapshotLength)

    snapshot.forEach(function (childSnapshot) {
      var childKey = childSnapshot.key;
      console.log(childKey);

      firebase.database().ref('/testimages/' + childKey).once("value", function(snapshot) {
        firebaseCount += 1
        
        if (snapshot.val()) {
          var childData = snapshot.val()
          console.log(childData)
          childData.key = childKey
          photosList.push(childData);
        }

        if(firebaseCount === snapshotLength) {
          photosList.reverse();
          setUpNewFeed(photosList,undefined,animationType.fromright)
        }
      })
    });


  });
}

var daisyCount = -1;
var daisyRight = true;

var stickerLeft = true
var stickerRandomIndex = anime.random(2, 8)

function generateFeed(photosList, stickers, feedAnimationType) {
  console.log("Generating feed")
 //clearFeed()

  var yvalue = 0;

  //yvalue = 1.25 - ((imagewidth * (photosList[0].height / photosList[0].width)) /2)

  if (scene.getObjectByName( "bottomOfFeed" )) {
    yvalue = scene.getObjectByName( "bottomOfFeed" ).position.y
  }

  for (var photo of photosList) {
    console.log(photo);
    if (yvalue < 0) {
      yvalue = yvalue - 0.5;
      yvalue = yvalue - (imagewidth * (photo.height / photo.width)) / 2;
    }

    var username = "sample";

    if (photo.creatorusername) {
      username = photo.creatorusername;
    }

    createPhoto(photo.url, 0, yvalue, username, photo, type.feedphoto, feedAnimationType);

    // if (daisyCount === 0) {
    //   addDaisy(
    //     imagewidth / 2 + 0.35,
    //     yvalue + (imagewidth * (photo.height / photo.width)) / 2 - 0.05,
    //     daisyRight
    //   );
    //   daisyRight = !daisyRight;
    // } else if (daisyCount === 3) {
    //   addDaisy(
    //     -imagewidth / 2 - 0.3,
    //     yvalue + (imagewidth * (photo.height / photo.width)) / 4,
    //     daisyRight
    //   );
    // } else if (daisyCount === 5) {
    //   addDaisy(
    //     -imagewidth / 2 - 0.3,
    //     yvalue + (imagewidth * (photo.height / photo.width)) / 4,
    //     daisyRight
    //   );
    //   daisyRight = !daisyRight;
    // } else if (daisyCount === 6) {
    //   daisyCount = -1;
    // }

    // daisyCount = daisyCount + 1;

    yvalue = yvalue - (imagewidth * (photo.height / photo.width)) / 2;

    if ((stickerIndex === stickerRandomIndex) && stickers !== undefined) {
      if (stickers[stickerCount]) {
      yvalue = yvalue - 0.8
      yvalue = yvalue - (imagewidth * (3/4)) / 2.3
      createSticker(yvalue, stickers[stickerCount], stickerLeft)
      yvalue = yvalue - (imagewidth * (3/4)) / 2.3
      yvalue -= 0
      stickerLeft = !stickerLeft
      stickerRandomIndex = anime.random(8, 12)
      stickerIndex = 0
      stickerCount += 1
      }
    }

    stickerLeft = !stickerLeft
    stickerIndex += 1

    // bottomoffeed = yvalue;

    // document.getElementById("root").style.height = -bottomoffeed * 125 + "px";
    // var el = document.getElementById("root");
    // el.style.height = 0 + "px";
  }

  if (scene.getObjectByName( "bottomOfFeed" )) {
    var object = scene.getObjectByName( "bottomOfFeed" )
    object.position.y = yvalue
  } else {
    var bottomOfFeedMesh = new THREE.Mesh()
    bottomOfFeedMesh.name = "bottomOfFeed"
    scene.add(bottomOfFeedMesh)
    bottomOfFeedMesh.position.y = yvalue
    photos.push(bottomOfFeedMesh)

  }

}

function createStickerMesh() {

    var cube = new THREE.Mesh(photoGeometry);
    var material = new THREE.MeshStandardMaterial()
    material.roughness = 0.15
    material.normalScale = new THREE.Vector2(0.35,0.35)

    cube.type = type.sticker
    cube.material = material
    cube.castShadow = true
    cube.receiveShadow = true

    assignPaperTexture(cube)
  // textureLoader.load(papermap2, function (texture) {
  //   console.log("TEXTURE LOADED", texture);
  //   cube.material.roughnessMap = texture
  //   cube.material.needsUpdate = true;
  //   // cube.material = material;
  // })


  return cube

};


function createSticker(yvalue, stickerobject, stickerOnLeft) {

  var cube = createStickerMesh()
  cube.material.opacity = 0

  var url = stickerobject.stickerimage

  textureLoader.load(url, function (maptexture) {
    console.log("texture loaded");
    cube.material.map = maptexture;
    cube.material.needsUpdate = true;
    fadeInObject(cube)
  });

  scene.add(cube)
  

  cube.position.y = yvalue
  cube.position.z = 0.05

  if (stickerOnLeft === true) {
    cube.rotation.z = 0.02 + (Math.random() * (0.1))
    cube.position.x = -imagewidth/3.75
  } else {
    cube.rotation.z = -(0.02 + (Math.random() * (0.1)))
    cube.position.x = imagewidth/3.75
  }

  cube.rotation.y = -0.005
  //cube.rotation.z = 0 + Math.random() * (-0.1 - 0.1) + -0.1;

  cube.scale.x = imagewidth * 1.2
  cube.scale.y = imagewidth * (3/4) * 1.2

  photos.push(cube)
}

function addDaisy(xvalue, yvalue, daisyRight) {
  var newdaisy = daisy.clone();
  //scene.add(newdaisy);
  var rotationvalue = Math.PI * 2;
  var randomtime = Math.random() * 10000;
  var randomx = Math.random() * 0.6;
  var randomrotationy = Math.random() * Math.PI;
  var randomscale = Math.random() * 0.1;

  if (!daisyRight) {
    rotationvalue = -rotationvalue;
    randomx = -randomx;
  }

  newdaisy.position.set(xvalue + randomx, yvalue, photozposition - 0.5);
  newdaisy.rotation.y = newdaisy.rotation.y + randomrotationy;
  newdaisy.scale.set(
    newdaisy.scale.x + randomscale,
    newdaisy.scale.x + randomscale,
    newdaisy.scale.x + randomscale
  );

  anime({
    targets: newdaisy.rotation,
    y: [
      {
        value: rotationvalue,
        easing: "linear",
        duration: 120000 + randomtime,
      },
    ],
    loop: true,
  });
}

function increaseHeightByThreeJSValue(value) {
  var el = document.getElementById("root");
  var height = el.offsetHeight;
  var newHeight = height + value * 134;
  el.style.height = newHeight + "px";
}

function calculateNewFeedSize() {
  sortPhotosByYPosition(photos);
  if (photos.length > 0) {
    var bottomoffeed = -photos[0].position.y || window.innerHeight;
    document.getElementById("root").style.height =
      bottomoffeed * 100 + window.innerHeight + "px";
  }

  loadUnloadPhotosByCameraDistance()
}

function loadUnloadPhotosByCameraDistance() {
  var cameraY = camera.position.y
  const distanceThreshhold = 20
  //sortPhotosByYPosition(photos)
  
  for (var photo of photos) {
    if (Math.abs(photo.position.y - cameraY) < distanceThreshhold) {
      console.log("Loading photo prelim")
      loadPhoto(photo)
    } else {
      console.log("Unloading photo prelim")
      unloadPhoto(photo)
    }
  }
}

function loadPhoto(photo) {

  if (photo.url) {
    if (!photo.loaded) {
      console.log("Loading photo")
      textureLoader.load(photo.url, function (maptexture) {
        console.log("texture loaded");
        photo.material.map = maptexture;
        photo.material.needsUpdate = true;
      });
    }
    photo.loaded = true
  }
}

function unloadPhoto(photo) {
  if (photo.url) {
    if (photo.loaded) {
      if (photo.material.map != null) {
        var texture = photo.material.map
        texture.dispose()
        photo.material.map = null
        photo.material.needsUpdate = true
      }
    }
    photo.loaded = false
  }
}

var tapped = false;

function sortPhotosByYPosition(photos) {
  photos.sort(function (a, b) {
    return a.position.y - b.position.y;
  });
}

function handlePhotoMouseDown(event) {
  if (!tapped) {
    //if tap is not set, set up single tap
    tapped = setTimeout(function () {
      tapped = null;

      if (event.intersects[0].object.name === "") {
        return;
      }

      console.log(event.intersects[0].object.position);
      anime({
        targets: event.intersects[0].object.position,
        z: [
          {
            value: photozposition - 0.25,
            easing: "easeInOutQuad",
            duration: 100,
          },
          {
            value: photozposition,
            easing: "easeInOutQuad",
            duration: 300,
            delay: 100,
          },
        ],
        loop: false,
        direction: "alternate",
      });

      //replyref = event.intersects[0].object.name;
      //document.getElementById("reply-input").click();

      console.log(
        "are replies visible " +
          areRepliesVisible[event.intersects[0].object.name]
      );
      if (
        (areRepliesVisible[event.intersects[0].object.name] || false) === false
      ) {
        areRepliesVisible[event.intersects[0].object.name] = true;
        displayReplies(event.intersects[0].object);
        console.log("Reply false");
      } else if (areRepliesVisible[event.intersects[0].object.name] === true) {
        console.log("Reply true");
        areRepliesVisible[event.intersects[0].object.name] = false;
        contractReplies(event.intersects[0].object);
      }
      //console.log(replyref);
    }, 300); //wait 300ms then run single click code
  } else {
    //tapped within 300ms of last tap. double tap
    clearTimeout(tapped); //stop single tap callback
    tapped = null;

    console.log("DOUBLE TAP");
    // double tap

    if (event.intersects[0].object.name === "") {
      return;
    }

    var position = event.intersects[0].object.worldToLocal(
      event.intersects[0].point
    );

    var point = {xposition: position.x, yposition: position.y}

    firebase.database().ref("/testimages/" + event.intersects[0].object.name + "/stars/" + firebase.auth().currentUser.uid).set(point)
  }
}

function contractReplies(object) {

  object.canClick = true

  var objectreplies = [];

  if (replies[object.name]) {
    objectreplies = replies[object.name];
  }

  animateInReplyMesh(replyMeshes[object.name]);

  anime({
    targets: object.position,
    x: [
      {
        value: 0,
        easing: "easeInOutQuad",
        duration: 300,
      },
    ],
  });

  anime({
    targets: replyLine[object.name].scale,
    y: [
      {
        value: 0,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
  });
  anime({
    targets: replyLine[object.name].position,
    x: [
      {
        value: replyLine[object.name].position.x + 0.1,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
  });

  anime({
    targets: replyLine[object.name].material,
    opacity: [
      {
        value: 0,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
    complete: function () {
      scene.remove(replyLine[object.name]);
    },
  });

  var lowestyreply = object.position.y - 0.01;

  if (Object.entries(objectreplies).length > 0) {
    lowestyreply = Object.entries(objectreplies)[
      Object.entries(objectreplies).length - 1
    ][1].object.position.y;
  }

  for (var photo of photos) {
    if (photo.position.y < lowestyreply) {
      anime({
        targets: photo.position,
        y: [
          {
            value: photo.position.y - yRepliesDifferential[object.name],
            easing: "easeInOutQuad",
            duration: 400,
          },
        ],
        complete: function() {
          object.canClick = true
        }
      });
    }
  }

  Object.entries(objectreplies).forEach(([key, value], index) => {
    removeItemAll(photos, value.object);

    object.attach(value.object);
    //value.object.scale.set(1,1,1)

    var material = new THREE.MeshStandardMaterial();
    material.color = new THREE.Color(generateReplyPlaceholderColor(index));
    value.object.material = material;
    value.object.material.needsUpdate = true;

    var position = generateReplyPlaceholderPosition(index);

    // value.object.position.x = position.x
    // value.object.position.y = position.y
    // value.object.position.z = position.z

    //value.object.children[0].opacity = 0

    for (var animation of value.animations || []) {
      animation.pause();
    }

    //value.object.rotation.set(0, 0, 0);

    for (var child of value.object.children) {
      anime({
        targets: child.material,
        opacity: [
          {
            value: 0,
            easing: "easeInOutQuad",
            duration: 300,
          },
        ],
        complete: function () {
          value.object.remove(child);
        },
      });
    }

    anime({
      targets: value.object.position,
      x: [
        {
          value: position.x,
        },
      ],
      y: [
        {
          value: position.y,
        },
      ],
      z: [
        {
          value: position.z,
        },
      ],
      easing: "easeInOutQuad",
      duration: 175,
      delay: 100,
      complete: function () {
        value.object.rotation.set(0, 0, 0);
      },
    });

    anime({
      targets: value.object.scale,
      x: [
        {
          value: 1,
        },
      ],
      y: [
        {
          value: 1,
        },
      ],
      z: [
        {
          value: 1,
        },
      ],
      easing: "easeInOutQuad",
      duration: 175,
      delay: 100,
    });

    //   anime({
    //     targets: value.object.rotation,
    //     x: [
    //       {
    //         value: 0,
    //       },
    //     ],
    //     y: [
    //       {
    //         value: 0,
    //       },
    //     ],
    //     z: [
    //       {
    //         value: 0,
    //       },
    //     ],
    //     easing: "easeInOutQuad",
    //     duration: 175,
    //     delay: 100,
    //   });
  });
}

function displayReplies(object) {
  object.canClick = false

  console.log("Object scale " + object.scale.y);
  const startingyvalue = object.scale.y / 2;
  var yvalue = object.position.y - startingyvalue;
  var midpoints = [];
  console.log("Starting value " + startingyvalue);
  var objectreplies = [];

  if (replies[object.name]) {
    objectreplies = replies[object.name];
  }

  anime({
    targets: object.position,
    x: [
      {
        value: 0 - 0.2,
        easing: "easeInOutQuad",
        duration: 300,
      },
    ],
  });

  Object.entries(objectreplies).forEach(([key, value], index) => {
    var color =
      "#" +
      interpolateColors(primarywhite, "3773B3", 1 - 1 / (index + 1 * 2), 16);

    console.log(key, value);
    console.log("Y value " + yvalue);

    scene.attach(value.object);

    if (yvalue < startingyvalue) {
      yvalue = yvalue - 0.5;
      yvalue = yvalue - (imagewidth * (value.height / value.width)) / 2;
    }

    midpoints.push(yvalue - object.position.y);

    textureLoader.crossOrigin = "Anonymous";
    // eslint-disable-next-line no-loop-func
    textureLoader.load(roughnessmap, function (texture) {
      console.log("TEXTURE LOADED", texture);
      //value.object.material.roughnessMap = texture;

      textureLoader.load(value.url, function (maptexture) {
        console.log("texture loaded");
        //var material = new THREE.MeshStandardMaterial()
        //material.map = maptexture
        //material.roughnessMap = texture

        //value.object.material = material
        // value.object.material.map = maptexture;
        // value.object.material.needsUpdate = true;
      });
    });

    anime({
      targets: value.object.scale,
      y: [
        {
          value: imagewidth * (value.height / value.width),
          easing: "easeInOutQuad",
          duration: 175,
          delay: 100,
        },
      ],
      complete: function () {
        // value.object.material.color = "0xffffff"

        var addRandomNumber = (Math.random() * 0.1) / 2;
        var addTimeRandomNumber = Math.random() * 200;

        value.animations = addRotationAnimation(
          value.object,
          addRandomNumber,
          addTimeRandomNumber
        );

        calculateNewFeedSize();

        var badgeStyle = "globe"
    
        if (followingList[value.creator] === true) {
          badgeStyle = "following"
          console.log("Found following")
        }

        var badge = addBadge(value.creatorusername, color, value.object,value.creator, badgeStyle);
        badge.material.opacity = 0;

        anime({
          targets: badge.material,
          opacity: [
            {
              value: 1,
              easing: "easeInOutQuad",
              duration: 750,
            },
          ],
        });
      },
    });

    anime({
      targets: value.object.position,
      y: [
        {
          value: yvalue,
          easing: "easeInOutQuad",
          duration: 175,
          delay: 100,
        },
      ],
      x: [
        {
          value: 0.1,
          easing: "easeInOutQuad",
          duration: 175,
          delay: 100,
        },
      ],
      complete: function () {
        photos.push(value.object);

        var material = new THREE.MeshStandardMaterial();
         value.object.material = material;
         assignGrimeTexture(value.object)


          textureLoader.load(value.url, function (maptexture) {
            console.log("texture loaded");
            material.map = maptexture;
            //material.roughnessMap = texture;

            // value.object.material.map = maptexture;
             value.object.material.needsUpdate = true;
          });
    
      },
    });

    anime({
      targets: value.object.position,
      z: [
        {
          value: photozposition - 0.5,
          easing: "easeInOutQuad",
          duration: 50,
        },
        {
          value: photozposition,
          easing: "easeInOutQuad",
          duration: 300,
          delay: 200,
        },
      ],
    });

    console.log(yvalue);

    yvalue = yvalue - (imagewidth * (value.height / value.width)) / 2;

  });

  drawReplyLine(yvalue - object.position.y, midpoints, object);

  

  var stickerdifferential = 0
  var nextPhotoDifferential = 0

  sortPhotosByYPosition(photos)

  for (var photo of photos) {
    if (photo.position.y < object.position.y && object.name != "") {

      nextPhotoDifferential = object.scale.y / 2
      break

    }
  }

  yRepliesDifferential[object.name] = yvalue - object.position.y + nextPhotoDifferential;
  
  for (var photo of photos.reverse()) {
    if (photo.position.y < object.position.y) {


      anime({
        targets: photo.position,
        y: [
          {
            value: photo.position.y + yvalue - object.position.y + nextPhotoDifferential,
            easing: "easeInOutQuad",
            duration: 550,
          },
        ],
        complete: function() {
          object.canClick = true
        }
      });
    }
  }
  if (!replyMeshes[object.name]) {
    createReplyMesh(object.position.y, object.name);
  } else {
    animateOutReplyMesh(replyMeshes[object.name]);
  }
}

function animateOutReplyMesh(mesh) {
  anime({
    targets: mesh.position,
    x: [
      {
        value: imagewidth / 2 + 0.1,
        easing: "easeInOutQuad",
        duration: 350,
        delay: 100,
      },
    ],
    z: [
      {
        value: photozposition - 0.3,
        easing: "easeInOutQuad",
        duration: 350,
        delay: 100,
      },
    ],
  });
}

function animateInReplyMesh(mesh) {
  anime({
    targets: mesh.position,
    x: [
      {
        value: 0,
        easing: "easeInOutQuad",
        duration: 350,
        delay: 100,
      },
    ],
    z: [
      {
        value: photozposition - 0.5,
        easing: "easeInOutQuad",
        duration: 350,
        delay: 100,
      },
    ],
  });
}

function createReplyMesh(yvalue, id) {
  var replymesh = drawReplySymbol();

  ///replymesh.name = id + "reply"

  replyMeshes[id] = replymesh;

  scene.add(replymesh);

  replymesh.position.set(0, yvalue, photozposition - 0.5);

  animateOutReplyMesh(replymesh);

  var scale = 0.45;
  replymesh.scale.set(scale, scale, scale);

  photos.push(replymesh);

  //addBadge("xcelspreadsheet","#" + primarywhite,replymesh)

  // var addRandomNumber = (Math.random() * 0.1) / 2;
  // var addTimeRandomNumber = Math.random() * 200;
  // addRotationAnimation(replymesh, addRandomNumber, addTimeRandomNumber);
  anime({
    targets: replymesh.rotation,
    y: [
      {
        value: Math.PI * 2,
        easing: "linear",
        duration: 8000,
      },
    ],
    loop: true,
  });

  replymesh.on("click", function () {
    replyref = id;
    document.getElementById("reply-input").click();
    anime({
      targets: replymesh.position,
      z: [
        {
          value: photozposition - 0.3 - 0.25,
          easing: "easeInOutQuad",
          duration: 100,
        },
        {
          value: photozposition - 0.3,
          easing: "easeInOutQuad",
          duration: 300,
          delay: 100,
        },
      ],
    });
  });
}

function drawReplySymbol() {
  var path = new THREE.Path();
  var xoffset = 0.425;
  var yoffset = -0.35;
  var multiplier = 1;
  // path.moveTo(-0.1 + xoffset * multiplier, 0.1 + yoffset * multiplier);
  // path.quadraticCurveTo(
  //   0 + xoffset * multiplier,
  //   0.45 + yoffset * multiplier,
  //   -0.5 + xoffset * multiplier,
  //   0.5 + yoffset * multiplier
  // );
  // path.lineTo(-0.5 + xoffset * multiplier, 0.6 + yoffset * multiplier);
  // path.lineTo(-0.75 + xoffset * multiplier, 0.4 + yoffset * multiplier);
  // path.lineTo(-0.5 + xoffset * multiplier, 0.2 + yoffset * multiplier);
  // path.lineTo(-0.5 + xoffset * multiplier, 0.3 + yoffset * multiplier);
  // path.quadraticCurveTo(
  //   -0.2 + xoffset * multiplier,
  //   0.3 + yoffset * multiplier,
  //   -0.1 + xoffset * multiplier,
  //   0.1 + yoffset * multiplier
  // );

  //path.lineTo( 1, 1 );

  path.moveTo(-0.05 , 0.2 )
  path.lineTo(-0.3 , 0 )
  path.lineTo(-0.05 , -0.2 )
  path.lineTo(-0.3 , 0 )
  path.lineTo( 0, 0 )
  path.quadraticCurveTo( 0.3, 0,   0.3, -0.20)
  path.quadraticCurveTo( 0.3, -0.4,   0.1, -0.4)
  path.quadraticCurveTo( -0.1, -0.2,0.1, -0.1)


  var points = path.getPoints(25);

  var geometry = new THREE.BufferGeometry().setFromPoints(points);

  var material = new THREE.LineBasicMaterial({ color: 0x00000 });

  // Create the final object to add to the scene
  var splineObject = new THREE.Line(geometry, material);
  // scene.add(splineObject);
  // splineObject.position.set(0, 0, 2);
  return splineObject;

}
//drawReplySymbol();
function drawReplyLine(endofline, midpoints, objectanchor) {
  // Create a sine-like wave
  // var curve = new THREE.SplineCurve( [
  // 	new THREE.Vector2( 0, 0 ),
  // 	new THREE.Vector2( 0, endofline ),
  // 	new THREE.Vector2( 0.1, endofline )
  // ] );

  // var points = curve.getPoints( 10 );

  var path = new THREE.Path();

  for (var [index, midpoint] of midpoints.entries()) {
    if (index === midpoints.length - 1) {
      path.lineTo(0, midpoint + 0.15);
      path.quadraticCurveTo(0, midpoint, 0.25, midpoint);
      console.log("last midpoint" + midpoint);
      continue;
    }
    // console.log("other midpoint" + midpoint);
    // path.lineTo(0, midpoint);
    // path.lineTo(0.15, midpoint);
    // path.lineTo(0, midpoint);

    path.lineTo(0, midpoint + 0.15);
    path.quadraticCurveTo(0, midpoint, 0.25, midpoint);
    path.quadraticCurveTo(0, midpoint, 0, midpoint - 0.15);
    console.log("last midpoint" + midpoint);

  }
  // var pointArray = []
  // pointArray.push(new THREE.Vector2(-0.05, 0))
  // for (var midpoint of midpoints) {

  //   const vectorPoint = new THREE.Vector2(0 + (imagewidth/2) + (Math.random() * 0.2), midpoint)
  //   const vectorPoint2 = new THREE.Vector2(0 - Math.random() * 0.5, midpoint - (Math.random() * 0.5))

  //   pointArray.push(vectorPoint2)
  //   pointArray.push(vectorPoint)
  // }

  // var curve =  new THREE.SplineCurve(pointArray)


  // path.lineTo(0, endofline + 0.1);
  // path.quadraticCurveTo(0, endofline, 0.1, endofline);

  //path.lineTo( 1, 1 );

  var points = path.getPoints();

  var geometry = new THREE.BufferGeometry().setFromPoints(points);

  var material = new THREE.LineBasicMaterial({ color: 0x00000 });

  // Create the final object to add to the scene
  var splineObject = new THREE.Line(geometry, material);

  var meshAnchor = new THREE.Mesh();
  scene.add(meshAnchor);
  meshAnchor.position.set(
    -(imagewidth / 2),
    objectanchor.position.y,
    photozposition - 0.5
  );
  meshAnchor.add(splineObject);
  meshAnchor.scale.y = 0;
  meshAnchor.scale.x = 0;

  photos.push(meshAnchor);

  replyLine[objectanchor.name] = meshAnchor;

  meshAnchor.material.opacity = 0;

  anime({
    targets: meshAnchor.scale,
    y: [
      {
        value: 1,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
    x: [
      {
        value: 1,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
  });
  anime({
    targets: meshAnchor.position,
    x: [
      {
        value: -(imagewidth / 2) - 0.1,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
  });

  anime({
    targets: meshAnchor.material,
    opacity: [
      {
        value: 1,
        easing: "easeInOutQuad",
        duration: 175,
        delay: 100,
      },
    ],
  });
}

function handlePhotoMouseUp(event) {
  // anime({
  //   targets: event.intersects[0].object.position,
  //   z: [{ value: photozposition, easing: "easeInOutQuad", duration: 300 }],
  //   loop: false,
  //   direction: "alternate",
  // });
}

function createReplyPlaceholder(originalcube, index) {
  var geometry = photoGeometry

  var color = generateReplyPlaceholderColor(index); //parseInt(
  //   "0x" + interpolateColors("3773B3", primarywhite, 1 / (index * 1.4), 16)
  // );

  var material = new THREE.MeshStandardMaterial({
    color: color,
  });
  var cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  originalcube.add(cube);
  // cube.position.x = 0.03 - 0.03 * (1 / (index * 1.5));
  // cube.position.y = -0.2 + -0.2 * -(1 / (index * 1.5));
  // cube.position.z = -0.1 + -0.1 * -(1 / (index * 1.5));

  var position = generateReplyPlaceholderPosition(index);

  cube.position.x = position.x;
  cube.position.y = position.y;
  cube.position.z = position.z;
  console.log(cube.position.y);

  // cube.scale.set(1/originalcube.scale.x, 1/originalcube.scale.y, 1/originalcube.scale.z);

  return cube;
}

function generateReplyPlaceholderColor(index) {
  index = index + 1;
  return parseInt(
    "0x" + interpolateColors("3773B3", primarywhite, 1 / (index * 1.4), 16)
  );
}

function generateReplyPlaceholderPosition(index) {
  index = index + 1;
  var x = 0.03 - 0.03 * (1 / (index * 1.5));
  var y = -0.2 + -0.2 * -(1 / (index * 1.5));
  var z = -0.1 + -0.1 * -(1 / (index * 1.5));
  return { x: x, y: y, z: z };
}

function fadeInObject(object) {
  object.material.opacity = 0

  anime({
    targets: object.material,
    opacity: [
      {
        value: 1,
        easing: "easeInOutQuad",
        duration: 300,
      },
    ],
  });
}

function createStarObject() {
  var geometry = new THREE.BufferGeometry().fromGeometry(new THREE.PlaneGeometry(0.0865, 0.08565, 0.1))
  var material = new THREE.MeshStandardMaterial();
  material.metalness = 0.5;
  material.roughness = 0.1;
  material.transparent = true;
  var object = new THREE.Mesh(geometry, material);


  // eslint-disable-next-line no-loop-func
  textureLoader.load(starimage, function (texture) {
    material.map = texture;
    material.roughnessMap = texture;
    textureLoader.load(starimagealpha, function (texture) {
      material.alphaMap = texture;
      material.needsUpdate = true
    })
  })

  return object
}

function addMoveStar(parentobject, starKey, xposition, yposition) {

  if (parentobject.getObjectByName(starKey)) {
    var star = parentobject.getObjectByName(starKey)
    star.position.x = xposition
    star.position.y = yposition
    //star.rotation.x = Math.random() * Math.PI

    fadeInObject(star)

    return
  }

  // var geometry = new THREE.PlaneGeometry(0.1, 0.1, 0.1);
  // var material = new THREE.MeshStandardMaterial();
  // material.metalness = 0.5;
  // material.roughness = 0.1;
  // material.transparent = true;

  // // eslint-disable-next-line no-loop-func
  // textureLoader.load(starimage, function (texture) {
  //   material.map = texture;
  //   material.roughnessMap = texture;
  //   textureLoader.load(starimagealpha, function (texture) {
  //     material.alphaMap = texture;
  //     var object = new THREE.Mesh(geometry, material);
    const object = new THREE.Mesh(starObject.geometry, starObject.material.clone())
      parentobject.add(object);
      object.position.set(xposition, yposition, 0.0001);
      //object.rotation.z = Math.random() * Math.PI
      object.name = starKey

      object.scale.set(
        1 / parentobject.scale.x,
        1 / parentobject.scale.y,
        1
      );

      fadeInObject(object)
  //   });
  // });
}




function createPhoto(
  url,
  xposition,
  yposition,
  username,
  photo,
  photoType,
  photoAnimationType,
  feedphoto,
  newphoto,
  newreply
) {
  // var photoGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(1, 1, 0.000001))
  var cube = new THREE.Mesh(photoGeometry);
  var material = new THREE.MeshStandardMaterial()
  cube.material = material

  assignGrimeTexture(cube)

  //material.needsUpdate = true

  var height = photo.height;
  var width = photo.width;
  var key = photo.key;

  // var textureLoader = new THREE.TextureLoader();
  // textureLoader.crossOrigin = "Anonymous";
  // textureLoader.load(roughnessmap, function (texture) {
  //   console.log("TEXTURE LOADED", texture);

  //     cube.material.roughnessMap = texture
  //     cube.material.needsUpdate = true
  //   });
    // cube.rotation.x = -0.1;
    // cube.rotation.y = -0.2;

    cube.scale.y = imagewidth * (height / width);
    cube.scale.x = imagewidth;
    cube.castShadow = true;
    cube.name = key;
    scene.add(cube);

    cube.position.y = yposition;
    cube.position.x = xposition;

    cube.canClick = false

    var badgeStyle = "globe"
    var badgeColor = "#fe5b30"

    console.log("Following photo " + photo.creator)
    console.log(followingList)

      if (followingList[photo.creator] === true) {
        badgeStyle = "following"
        badgeColor = "#" + primarydarkpink
        console.log("Found following")
      }
    

    if (photoAnimationType === animationType.fromabove) {
      cube.position.z = 5;
      cube.material.opacity = 0;

      anime({
        targets: cube.position,
        z: [
          {
            value: photozposition,
            easing: "spring(1, 80, 10, 0)",
            duration: 800 + -yposition * 100,
          },
        ], 
        complete: function() {
          cube.canClick = true
        }
      });

      anime({
        targets: cube.material,
        opacity: [
          {
            value: 1,
            easing: "easeInOutQuad",
            duration: 800 + -yposition * 10,
          },
        ],
      });

      var addRandomNumber = (Math.random() * 0.1) / 2;
      var addTimeRandomNumber = Math.random() * 200;
    
    
      addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);
    }

    if (photoType === type.feedphoto || photoType === type.newphoto) {

      cube.url = url
      cube.loaded = false

      addStarsRefs(cube,key)
      addPhotoClickEvent(cube)
      addBadge(username, badgeColor, cube, photo.creator, badgeStyle);


    } 
    
    if (photoAnimationType === animationType.fromleft) {
      cube.position.z = photozposition;
      cube.position.x = xposition - 8
      cube.position.y = yposition + 1.5
      cube.rotation.z = -0.5;
    

      anime({
        targets: cube.rotation,
        z: [
          {
            value: 0,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 3000,
      });

      anime({
        targets: cube.position,
        x: [
          {
            value: xposition,
          },
        ],
        easing: "spring(1, 100, 20, 0)",
        duration: 1800,
        delay: anime.random(0, 150),
        complete: function() {
          cube.canClick = true
        }
      });

      anime({
        targets: cube.position,
        y: [
          {
            value: yposition,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 1800 ,
        complete: function () {
          var addRandomNumber = (Math.random() * 0.1) / 2;
          var addTimeRandomNumber = Math.random() * 200;

          addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);
        },
      });
    }

    if (photoAnimationType === animationType.fromright) {
      cube.position.x = xposition + 8;
      cube.position.y = yposition + 0.75;
      cube.position.z = photozposition;
      cube.rotation.z = -0.5;

      anime({
        targets: cube.rotation,
        z: [
          {
            value: 0,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 2000,
      });

      anime({
        targets: cube.position,
        x: [
          {
            value: xposition,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 1800,
        delay: anime.random(0, 150),
        complete: function() {
          cube.canClick = true
        }
      });

      anime({
        targets: cube.position,
        y: [
          {
            value: yposition,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 1800 ,
        complete: function () {
          var addRandomNumber = (Math.random() * 0.1) / 2;
          var addTimeRandomNumber = Math.random() * 200;

          addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);
        },
      });
    }

    if (photoType === type.newreply) {

      textureLoader.load(url, function (texture) {
        console.log("TEXTURE LOADED", texture);
    
          cube.material.map = texture
          cube.material.needsUpdate = true
        });

        var color =
      "#" +
      interpolateColors(primarywhite, "3773B3", 0.25);
      addBadge(username, color, cube, photo.creator, badgeStyle);

    }

    //cube.position.z = photozposition;

    photos.push(cube);
    photoDataByKey[key] = photo

    if (photo.replies) {
      console.log("FOUDN REPLIES");
      Object.entries(photo.replies)
        .reverse()
        .forEach(([replykey, replyvalue], index) => {
          console.log(`${index}: ${replykey} = ${replyvalue}`);
          var newplaceholder = createReplyPlaceholder(cube, index, cube);
          console.log(newplaceholder);
          replyvalue.object = newplaceholder;
          if (replies[key]) {
            replies[key][replykey] = replyvalue;
          } else {
            replies[key] = {};
            replies[key][replykey] = replyvalue;
          }
          console.log(replies);
        });
    }



    // textureLoader.load(url, function (maptexture) {
    //   console.log("texture loaded");
    //   cube.material.map = maptexture;
    //   cube.material.needsUpdate = true;

      
    // });

  calculateNewFeedSize()

  return cube;
}

function addPhotoClickEvent(cube) {
  cube.cursor = "pointer";
  cube.on("click", (ev) => {
    console.log(ev);
    if (ev.intersects[0].object.canClick === true) {
      handlePhotoMouseDown(ev);
    }
  });
}

function addStarsRefs(cube, key) {
  var starsRef = firebase.database().ref('testimages/' + key + "/stars");

  starsRef.on('child_added', function(data) {
    console.log(data)
    addMoveStar(cube, data.key, data.val().xposition, data.val().yposition)
 });
 starsRef.on('child_changed', function(data) {
  console.log(data)
  addMoveStar(cube, data.key, data.val().xposition, data.val().yposition)
});
 cube.starsRef = starsRef
}

function addUIDToFollowList(uid) {
  firebase.database().ref("/following/" + firebase.auth().currentUser.uid + "/" + uid).set(true)
}

function addFollowedPostToPrivateFeed(addedUID) {
  firebase.database().ref('/testimages/').orderByChild('creator').equalTo(addedUID).once('value',function(snapshot) {
    for (let key in snapshot.val()) {
        firebase.database().ref('privatefeeds/' + firebase.auth().currentUser.uid + '/' + key).set(true)
    }
})
}

function removeUIDFromFollowList(uid) {
  firebase.database().ref("/following/" + firebase.auth().currentUser.uid).child(uid).remove()
}

function removeFollowedPostFromPrivateFeed(removedUID) {
  firebase.database().ref('/testimages/').orderByChild('creator').equalTo(removedUID).once('value',function(snapshot) {
      for (let key in snapshot.val()) {
          firebase.database().ref('privatefeeds/' + firebase.auth().currentUser.uid).child(key).remove()
      }
  })
}

function handleFollow(uid) {
  console.log(uid)
  addUIDToFollowList(uid)
  addFollowedPostToPrivateFeed(uid)
}

function handleUnfollow(uid) {
  removeUIDFromFollowList(uid)
  removeFollowedPostFromPrivateFeed(uid)
}

function addBadge(username, color, object, uid, badgeStyle) {
  var mesh = circleBadge(username, 100, 100, 50, Math.PI / 2, 0.45, color, badgeStyle);

  object.add(mesh);

  mesh.cursor = "pointer";
  mesh.on("click", (ev) => {
    console.log(ev);

    anime({
      targets: object.rotation,
      x:  object.rotation.x + 0.05,
      y: object.rotation.y + 0.12,
      easing: 'easeOutElastic',
      duration:transitionTime + 200,
      direction:'alternate',
     complete: function() {
      // handleFollow(uid);

     }})

    anime({
      targets: object.position,
      x:  object.position.x - 0.25,
      easing: 'easeInQuad',
      duration:transitionTime/2,
     complete: function() {
      // handleFollow(uid);

     }})

     setTimeout(function() {
      window.App.goForward(username,uid,null,requestUserPhotos, uid,photos)
      // addToBackDict(currentPhotosList, stickers, null,window.App.state.currentTitle, uid)
      // transitionPhotosLeft(photos)

      // setTimeout(function() { 
      //   requestUserPhotos(uid)
      // }, transitionTime - 100);  
      // window.App.setState({
      //   currentTitle:username,
      //   currentTitleUid: uid
      // })
     }, transitionTime/2)


  });


  mesh.scale.y = 1 / object.scale.y;
  mesh.scale.x = 1 / object.scale.x;
  mesh.scale.z = 1 / object.scale.z;

  mesh.position.z = 0.05;
  mesh.position.y = -imagewidth / 4;
  mesh.position.x = imagewidth / 4;
  return mesh;
}

function addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber) {
  var animation1 = anime({
    targets: cube.rotation,
    x: [
      {
        value: -0.015 - addRandomNumber / 2,
        easing: "easeInOutQuad",
        duration: 3500 + addTimeRandomNumber,
      },
      {
        value: 0.015 + addRandomNumber / 2,
        easing: "easeInOutQuad",
        duration: 3500 + addTimeRandomNumber,
      },
    ],
    loop: true,
    direction: "alternate",
  });
  var animation2 = anime({
    targets: cube.rotation,
    y: [
      {
        value: -0.01 - addRandomNumber / 2,
        easing: "easeInOutQuad",
        duration: 4000 - addTimeRandomNumber,
      },
      {
        value: 0.01 + addRandomNumber / 2,
        easing: "easeInOutQuad",
        duration: 4000 - addTimeRandomNumber,
      },
    ],
    loop: true,
    direction: "alternate",
    duration: 4000,
  });

  var animation3 = anime({
    targets: cube.rotation,
    z: [
      {
        value: -0.002 - addRandomNumber / 6,
        easing: "easeInOutQuad",
        duration: 4000 - addTimeRandomNumber,
      },
      {
        value: 0.002 + addRandomNumber / 6,
        easing: "easeInOutQuad",
        duration: 4000 - addTimeRandomNumber,
      },
    ],
    loop: true,
    direction: "alternate",
    duration: 4000,
  });

  return [animation1, animation2, animation3];
}

function hasTouch() {
  return (
    "ontouchstart" in document.documentElement ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

CanvasRenderingContext2D.prototype.fillTextCircle = function (
  text,
  x,
  y,
  radius,
  startRotation
) {
  var numRadsPerLetter = (2 * Math.PI) / text.length;
  var numRadsPerLetter = 0.35;
  this.save();
  this.translate(x / 2, y / 2);
  this.rotate(startRotation);

  for (var i = 0; i < text.length; i++) {
    this.save();
    this.rotate(i * numRadsPerLetter);

    this.fillText(text[i], 0, -radius);
    this.restore();
  }
  this.restore();
};

function drawImage(ctx, x, imageToDraw, texture) {

  var image = new Image()
  image.onload = function() {
    ctx.drawImage(image,x/3.72,x/3.72,x/2.15,x/2.15)
    texture.needsUpdate = true
  }
  image.src = imageToDraw

}

function drawFace(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x / 2, x / 2, radius / 2.14, 0, Math.PI * 2, true); // Outer circle
  ctx.moveTo(110, 75);
  ctx.arc(x / 2, x / 2, radius / 3, 0, Math.PI, false); // Mouth (clockwise)
  ctx.moveTo(65, 65);
  ctx.arc(x / 2.5, y / 2.3, radius / 15, 0, Math.PI * 2, true); // Left eye
  ctx.moveTo(x / 1.58, y / 2.3);
  ctx.arc(x / 1.66, y / 2.3, radius / 15, 0, Math.PI * 2, true); // Right eye
}

function circleBadge(
  text,
  x,
  y,
  radius,
  startRotation,
  threejsdimension,
  color,
  badgeStyle
) {
  var textcanvas = document.createElement("canvas");
  var ctx = textcanvas.getContext("2d");

var texture = new THREE.Texture(textcanvas); // now make texture
  texture.minFilter = THREE.LinearFilter; // eliminate console message
  //texture.needsUpdate = true;

  textcanvas.width = x;
  textcanvas.height = y;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x / 2, y / 2, radius * 2, 0, Math.PI * 2, true); // Outer circle
  //ctx.fillRect(0, 0, ctx.width, ctx.height);

  if (badgeStyle === "globe") {
    drawImage(ctx, x, globeimage, texture)
  } else if (badgeStyle === "following") {
    drawImage(ctx, x, smileyimage, texture)
  }

  ctx.fill();

  ctx.fillStyle = "#00000f";
  ctx.font = "italic 20px Times New Roman";

  ctx.fillTextCircle(text + " ", x, y, (radius / 3) * 1.8, -Math.PI / 2);

  ctx.stroke();



  //var geometry = new THREE.CylinderGeometry(threejsdimension, threejsdimension, 0.05, 20);
  var geometry = new THREE.BufferGeometry().fromGeometry( new THREE.CircleGeometry(threejsdimension / 2, 20))
  var material1 = new THREE.MeshBasicMaterial({
    color: 0xfe5b30,
    opacity: 1.0,
  });
  var material2 = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    map: texture,
    transparent: true,
    opacity: 1.0,
  });
  const materials = [material1, material2, material2];
  // and finally, the mesh
  var mesh = new THREE.Mesh(geometry, material2);
  mesh.castShadow = true;
  return mesh;
}

if (hasTouch()) {
  // remove all the :hover stylesheets
  try {
    // prevent exception on browsers not supporting DOM styleSheets properly
    for (var si in document.styleSheets) {
      var styleSheet = document.styleSheets[si];
      if (!styleSheet.rules) continue;

      for (var ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
        if (!styleSheet.rules[ri].selectorText) continue;

        if (styleSheet.rules[ri].selectorText.match(":hover")) {
          styleSheet.deleteRule(ri);
        }
      }
    }
  } catch (ex) {}
}

class ThreeJS extends Component {
  componentDidMount() {
    // === THREE.JS CODE START ===
    var rotationmodifier = 0.0001;

    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      8
    );
    if (((window.innerWidth / window.innerHeight) * 1.6666) < 1) {
      camera.zoom = (window.innerWidth / window.innerHeight) * 1.6666
    } else {
      camera.zoom = 1
    }


    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2 || 1));
    renderer.powerPreference = "low-power"
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.setSize(window.innerWidth, window.innerHeight);
    this.mount.appendChild(renderer.domElement);

    var geometry = new THREE.PlaneGeometry(800, 800, 800);
    var material = new THREE.ShadowMaterial({
      color: 0x666666,
      side: THREE.DoubleSide,
    });
    material.opacity = 0.2;
    var plane = new THREE.Mesh(geometry, material);
    plane.position.z = 0;
    plane.receiveShadow = true;
    scene.add(plane);

    scene.add(camera);
    camera.position.z = 5;
    camera.zoom = 1

    const interaction = new Interaction(renderer, scene, camera);

    //requestLatestPhotos();

    // var cubeloader = new THREE.CubeTextureLoader();

    // var textureCube = cubeloader.load([
    //   holographicmap,
    //   holographicmap,
    //   holographicmap,
    //   holographicmap,
    //   holographicmap,
    //   holographicmap,
    // ]);

    // var normalMap = textureLoader.load(papermap)
    // var geometry = new THREE.BoxGeometry(2,2,0.1)
    // var material = new THREE.MeshStandardMaterial()
    // material.normalMap = normalMap
    // material.normalScale = new THREE.Vector2(0.4,0.4)
    // material.normalMapType = THREE.ObjectSpaceNormalMap
    // material.envMap = textureCube
    // material.metalness = 0.9
    // material.envMap.mapping = THREE.CubeReflectionMapping
    // var object = new THREE.Mesh(geometry,material)
    // //scene.add(object)
    // object.position.set(0,0,1.75)

    // anime({
    //     targets: object.rotation,
    //     x: [
    //       {
    //         value: Math.PI * 2,
    //         easing: "linear",
    //         duration: 6000,
    //       },
    //     ],
    //     y: [
    //       {
    //         value: Math.PI * 2,
    //         easing: "linear",
    //         duration: 6000,
    //       },
    //     ],
    //     loop: true,
    //   });

    // var loader = new GLTFLoader();

    // loader.load(scenedata, function (gltf) {
    //   console.log("loaded scene");

      // gltf.scene.traverse(function (object) {
      //   console.log("GLTF traverse");
      //   console.log(object.name);
      // });

      // //gltf.scene.position.z = -1000
      // daisy = gltf.scene.getObjectByName("daisy002");
      // scene.add(daisy);
      // daisy.scale.set(0.25, 0.25, 0.25);
      // daisy.rotation.set(-Math.PI / 2, -Math.PI, -Math.PI);
      // // daisy.position.set(imagewidth/2 + 0.25,-0.25,photozposition - 0.75)
      // daisy.position.set(1000, 1000, 1000);
      // daisy.children[0].castShadow = true;
      // daisy.children[1].castShadow = true;

      // var diamond = gltf.scene.getObjectByName("diamond1");
      // // scene.add(diamond);
      // diamond.scale.set(0.1, 0.1, 0.1);
      // diamond.rotation.set(-Math.PI / 2, -Math.PI, -Math.PI);
      // // daisy.position.set(imagewidth/2 + 0.25,-0.25,photozposition - 0.75)
      // diamond.position.set(0, 0, 2);
      // diamond.castShadow = true;
      // console.log(diamond);

      // var diamondmaterial = new THREE.MeshStandardMaterial();
      // diamond.material = diamondmaterial;
      // //diamond.material.color = new THREE.Color("0x" + "BEBEBE");
      // diamond.material.metalness = 1;
      // diamond.material.roughness = 0;
      // diamond.material.refractionRatio = 0.95;
      // //diamond.material.envMap.mapping = THREE.CubeRefractionMapping
      // // diamond.material.envMap = textureCube
      // var cubeloader = new THREE.CubeTextureLoader();

      // var textureCube = cubeloader.load([
      //   holographicmap,
      //   holographicmap,
      //   holographicmap,
      //   holographicmap,
      //   holographicmap,
      //   holographicmap,
      // ]);

      // var normalMap = textureLoader.load(papermap)
      // var geometry = new THREE.BoxGeometry(2,2,0.1)
      // var material = new THREE.MeshStandardMaterial()
      // material.normalMap = normalMap
      // material.envMap = textureCube
      // material.metalness = 0.9
      // var object = THREE.Mesh(geometry,material)
      // scene.add(object)
      // object.position.set(0,0,2)

      // diamond.material.normalMap = normalMap
      // diamond.material.metalnessMap = normalMap
      // diamond.material.map = normalMap
      // diamond.material.roughnessMap = normalMap
      // textureCube.mapping = THREE.CubeRefractionMapping;
      // diamond.material.envMap = textureCube;
      // diamond.material.transparent = true;
      // diamond.material.opacity = 1;


      // //diamond.material.envMapIntensity = 0.5

      // textureLoader.load(scratchmap, function (texture) {
      //   diamond.material.roughnessMap = texture
      //   console.log('loaded scratch map')
      //           })

      // anime({
      //   targets: diamond.rotation,
      //   x: [
      //     {
      //       value: Math.PI * 2,
      //       easing: "linear",
      //       duration: 6000,
      //     },
      //   ],
      //   y: [
      //     {
      //       value: Math.PI * 2,
      //       easing: "linear",
      //       duration: 6000,
      //     },
      //   ],
      //   loop: true,
      // });

      // anime({
      //   targets: diamond.position,
      //   x: [
      //     {
      //       value: -1,
      //       easing: "linear",
      //       duration: 6000,
      //     },
      //   ],
      //   loop: true,
      // });

      //             var material = new THREE.MeshStandardMaterial( { color: "0xfffff", envMap: textureCube, refractionRatio: 0.95, roughness:0 } );
      // material.envMap.mapping = THREE.CubeRefractionMapping;
      // diamond.material.dispose()
      // diamond.material = material

      //diamond.material.transparent = true
      //diamond.material.opacity = 1

    //   console.log(daisy);

    //   // daisy.children[0].material = new THREE.MeshStandardMaterial({
    //   //   color: new THREE.Color("0x" + primarywhite)
    //   // })
    // });

    var spotLight = new THREE.DirectionalLight(0xfff1db);
    spotLight.intensity = 0.65;

    spotLight.castShadow = true;

    const shadowmapmultiplier = 3;

    spotLight.shadow.mapSize.width = 1024 * 1;
    spotLight.shadow.mapSize.height = 1024 * 1;

    const d = 4;

    spotLight.shadow.bias = - 0.0005

    spotLight.shadow.camera.left = -d;
    spotLight.shadow.camera.right = d;
    spotLight.shadow.camera.top = d;
    spotLight.shadow.camera.bottom = -d;
    spotLight.shadow.radius = d;

    spotLight.target.position.set(0, 0, 0);
    //spotLight.shadow.bias = -0.0005
    camera.add(spotLight);
    spotLight.position.set(0, 5.25, 10);

    camera.add(spotLight.target);

    var light2 = new THREE.AmbientLight(0xfff1db,0.45)
    scene.add(light2)

    // var light2 = new THREE.DirectionalLight(0xfff1db); // soft white light
    // light2.intensity = 0.25;
    // //light2.shadow.bias = -0.0005

    // camera.add(light2);
    // light2.position.set(0, -9.5, 10);
    // //camera.add(light2);

    var animate = function () {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      //renderer.render(scene2)
    };
    animate();

    var checkScrollSpeed = (function (settings) {
      settings = settings || {};

      var lastPos,
        newPos,
        timer,
        delta,
        delay = settings.delay || 50; // in "ms" (higher means lower fidelity )

      function clear() {
        lastPos = null;
        delta = 0;
      }

      clear();

      return function () {
        newPos = window.scrollY;
        if (lastPos != null) {
          // && newPos < maxScroll
          delta = newPos - lastPos;
        }
        lastPos = newPos;
        clearTimeout(timer);
        timer = setTimeout(clear, delay);
        return delta;
      };
    })();
    window.onscroll = function () {
      scrollCam();
      loadUnloadPhotosByCameraDistance()
      console.log(renderer.info)

      // @var int totalPageHeight
      var totalPageHeight = document.body.scrollHeight; 

      // @var int scrollPoint
      var scrollPoint = window.scrollY + window.innerHeight;

      // check if we hit the bottom of the page
      if(scrollPoint >= totalPageHeight)
      {
          console.log("at the bottom");
          currentPage += 1

          var feedAnimationType = animationType.fromleft

          if (window.App.state.mode === "all") {
            feedAnimationType = animationType.fromleft
          } 
          
          if (window.App.state.mode === "private") {
            feedAnimationType = animationType.fromright
          } 
          
          if (backDicts.length > 0) {
            feedAnimationType = animationType.fromright
          }

          generateFeed(paginateArray(currentPhotosList,20,currentPage),stickers,feedAnimationType)
      }
    };

    function scrollCam() {
      calculateNewFeedSize();
      var winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      var height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      var scrolled = winScroll / height;
      camera.position.y = 0 - winScroll / 100;
      //spotLight.position.y = 0 + bottomoffeed * scrolled;
      //rotationmodifier = Math.abs(checkScrollSpeed());
      //console.log (checkScrollSpeed())
    }

    var globalResizeTimer = null;

    $(window).resize(function () {
      // if (globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
      // globalResizeTimer = window.setTimeout(function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        if (((window.innerWidth / window.innerHeight) * 1.6666) < 1.05) {
          camera.zoom = (window.innerWidth / window.innerHeight) * 1.6666
        } else {
          camera.zoom = 1
        }
        renderer.setSize(window.innerWidth, window.innerHeight);
      // }, 200);
    }
    );

    var scrollStop = function (callback) {
      // Make sure a valid callback was provided
      if (!callback || typeof callback !== "function") return;

      // Setup scrolling variable
      var isScrolling;

      // Listen for scroll events
      window.addEventListener(
        "scroll",
        function (event) {
          // Clear our timeout throughout the scroll
          window.clearTimeout(isScrolling);

          // Set a timeout to run after scrolling ends
          isScrolling = setTimeout(function () {
            // Run the callback
            callback();
          }, 66);
        },
        false
      );
    };
    scrollStop(function () {
      rotationmodifier = 0;
    });

    // === THREE.JS EXAMPLE CODE END ===
  }
  render() {
    return <div className="backgroundcanvas" ref={(ref) => (this.mount = ref)} />;
  }
}

function addToBackDict(photosList, stickers,div,title, uid) {
  if (div) {
   div.classList.add('sentBack')
  }
  var newBackDict = {
    'div': div,
    'photosList' : photosList,
    'stickers' : stickers,
    'title' : title,
    'scroll': window.scrollY,
    'uid' : uid
  }
  backDicts.push(newBackDict)
  window.App.setState({
    minimalUI:true
  })
}

class AccountForm extends Component {

  constructor() {
    super();
    this.state = {
      formDisplay: false,
      strokeCount: 0,
      notificationList:[],
      number:""
    };
    this.dismissForm = this.dismissForm.bind(this)
    this.stickerForm = React.createRef()
    this.accountForm = React.createRef()
    this.notificationList = React.createRef()
    this.signOut = this.signOut.bind(this)
    this.addStroke = this.addStroke.bind(this)
    this.clearStroke = this.clearStroke.bind(this)
    this.requestUserPhotos = this.requestUserPhotos.bind(this)
  }

  componentDidMount() {

  }

  addStroke() {
    this.setState({
      strokeCount: this.state.strokeCount + 1
    })
    console.log(this.state.strokeCount)
  }

  clearStroke() {
    this.setState({
      strokeCount: 0
    })
  }

  dismissForm() {
    if (this.state.strokeCount > 0 ) {
      this.stickerForm.current.submit()
    }

    this.setState({
      formDisplay:false,
    })

    this.props.dismissAccountForm()

    this.clearStroke()
    this.props.maximizeUI()
    this.props.setNotificationsRead()
    this.markNotificationsAsRead()
  }

  markNotificationsAsRead() {
    for(var notification of this.state.notificationList) {
      if (notification.val().status === "unread") {
        notification.ref.child('status').set('read')
      }
    }
  }

  showForm() {
    this.setState({
      formDisplay:true
    })
    this.requestNotifications()
  }

  requestNotifications() {
    const component = this
    firebase
    .database()
    .ref("notifications/" + firebase.auth().currentUser.uid).limitToLast(50)
    .once('value', function (snapshot) {
      console.log("Notification")
      console.log(snapshot.val())
      var notifications = []
      snapshot.forEach(function(childSnapshot) {

        notifications.push(childSnapshot)

      })
      component.setState({
        notificationList:notifications.reverse()
      })
    })
  }

  signOut() {
    signOut()
    this.setState({
      formDisplay:false
    })
    this.props.maximizeUI()
    this.props.dismissAccountForm()
    this.props.loginForm.current.setState({
        success:false
    })
  }

  requestUserPhotos(uid, displayName) {
    this.props.goForward(displayName, uid, this.accountForm.current, requestUserPhotos, uid, photos)
    this.props.dismissAccountForm()
    this.props.setHamburgerHidden()
  }

  requestSinglePhoto(uid, creatorName) {
    this.props.goForward(creatorName + "'s photo", "", this.accountForm.current, requestSinglePhoto, uid, photos)
    this.props.dismissAccountForm()
    this.props.setHamburgerHidden()

  }

  render() {
    return (
      <div ref={this.accountForm} className={"accountform " +
      (this.state.formDisplay
        ? "accountformopen"
        : "")}>
        <div className="stickerheader">
        <div className="ratio">  <svg viewBox="0 0 4 3"></svg>
{/* <CanvasDraw imgSrc="" canvasHeight="300" canvasWidth="400" style={{background:"rgb(0,0,0,0)", height:"300px", width:"400px"}} brushRadius={1} hideGrid={true} brushColor="#00000" lazyRadius={1} hideInterface={true}/>  */}
{/* <SignatureCanvas canvasProps={{width: 400, height: 300, className: 'sigCanvas'}}></SignatureCanvas> */}
<StickerForm formDisplay={this.state.formDisplay} ref={this.stickerForm} addStroke={this.addStroke}/>
        </div>
        <div class="row">
  <div class="block">
    <h1>
      <span><div className="usertext">{this.props.loggedInUser['username']||''}
      <div className="usernumber">&#10036;&#xFE0E;{this.props.userNumber}</div></div></span>
    </h1>
   </div>
</div>
</div>
       {/* <div className="accountreadout"> */}
       <NotificationList newNotifications={this.props.newNotifications} ref={this.notificationList} notificationList={this.state.notificationList} requestSinglePhoto={this.requestSinglePhoto.bind(this)} setCurrentTitle={this.props.setCurrentTitle} accountForm={this.accountForm.current} currentTitle={this.props.currentTitle}></NotificationList>
       <ShortUserList requestUserPhotos={this.requestUserPhotos.bind(this)} setCurrentTitle={this.props.setCurrentTitle} accountForm={this.accountForm.current} currentTitle={this.props.currentTitle}></ShortUserList>
       <DialList/>

         <div className="toolbarcontainer">
      <button id="title" onClick={() => this.requestUserPhotos(firebase.auth().currentUser.uid, firebase.auth().currentUser.displayName)}><div className="buttonsymbol">&#12297;</div>View Photos</button>
       <button id="title" onClick={this.signOut}><div className="buttonsymbol">&#12296;</div>Sign Out</button>
       
       </div>
    {/* </div> */}
    {/* <div className="dismiss" onClick={this.dismissForm}></div> */}
      </div>
    );
  }

}

function fadeOutPhotos() {
  scene.opacity = 0
}

function fadeInPhotos() {
  scene.opacity = 1
}


function uploadSticker(file) {
  var url = `https://api.cloudinary.com/v1_1/cathedralapp/upload`;
  var xhr = new XMLHttpRequest();
  var fd = new FormData();

  xhr.open("POST", url, true);
  xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

  xhr.onreadystatechange = function (e) {
    if (xhr.readyState == 4 && xhr.status == 200) {
      var response = JSON.parse(xhr.responseText);

      console.log("UPLOADED")

      var url = response.secure_url;
      console.log(url);

      const sigRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/stickerimage');
      sigRef.set(url)

      const userRef = firebase.database().ref('stickerusers/' + firebase.auth().currentUser.uid  + '/stickerimage')
      userRef.set(url)
    }
  }
  

  fd.append("upload_preset", "sunshinesticker");
  fd.append("tags", "browser_upload"); // Optional - add tag for image admin in Cloudinary
  fd.append("file", file);
  xhr.send(fd);
}

async function getBase64ImageFromUrl(imageUrl) {
  var res = await fetch(imageUrl);
  var blob = await res.blob();

  return new Promise((resolve, reject) => {
    var reader  = new FileReader();
    reader.addEventListener("load", function () {
        resolve(reader.result);
    }, false);

    reader.onerror = () => {
      return reject(this);
    };
    reader.readAsDataURL(blob);
  })
}

class StickerForm extends Component {
  
  constructor() {
    super()
    this.sigCanvas = React.createRef()
    this.undo = this.undo.bind(this)
    this.submit = this.submit.bind(this)
  }

  componentDidMount() {

    var component = this

    var canvas = this.sigCanvas.current.getCanvas()
    var ctx = canvas.getContext('2d')

    var image = new Image()

    image.crossOrigin = "anonymous"

    image.onload = function() {
      ctx.drawImage(image,0,0,400,300)
    }

    image.src = stickerbg

    firebase.auth().onAuthStateChanged( function(user) {

      firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/stickerimage').once('value').then(function(snapshot) {
        console.log("saved image")
        console.log(snapshot.val())

        var canvas = component.sigCanvas.current.getCanvas()
        var ctx = canvas.getContext('2d')

        var image = new Image()

        image.crossOrigin = "anonymous"

        image.onload = function() {
          ctx.drawImage(image,0,0,400,300)
        }

        image.src = snapshot.val()

      })
    })
  }

  undo() {
    // console.log(this.sigCanvas.current)
    // this.sigCanvas.current.clear()
    var canvas = this.sigCanvas.current.getCanvas()
    var ctx = canvas.getContext('2d')
    var image = new Image()

    image.crossOrigin = "anonymous"

    image.onload = function() {
      ctx.drawImage(image,0,0,400,300)
    }

    image.src = stickerbg
    firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/stickerimage').remove()
  }

  submit() {
    var image = this.sigCanvas.current.toDataURL("image/png")
    uploadSticker(image)
    var points = this.sigCanvas.current.toData()
    console.log(points)
  }


  render() {
    return (
      <div className={"signatureform "} >
<SignatureCanvas onEnd={this.props.addStroke} ref={this.sigCanvas} canvasProps={{width: 400, height: 300, className: 'sigCanvas'}}></SignatureCanvas>
<div className="stickerbuttoncontainer"><button onClick={this.undo}>&#x27f2;</button></div>
        </div>
    );
  }
}


class LoginForm extends Component {
  constructor() {
    super();
    this.state = {
      username: "",
      password: "",
      loginregtext: "i'm new",
      errortext: "",
      error: false,
      usernameexists: false,
      tryingtologin: false,
      success: false
    };
    this.handleChange = this.handleChange.bind(this);
    this.handlePassword = this.handlePassword.bind(this);
    this.handleUpload = this.handleUpload.bind(this);

  }
  handleChange(e) {
    console.log("handling chnage");
    var component = this;

    component.setState(
      {
        [e.target.name]: e.target.value,
        errortext: "",
      },
      function () {
        firebase
          .database()
          .ref("/users/")
          .orderByChild("username")
          .equalTo(this.state.username)
          .once("value")
          .then(function (snapshot) {
            var children = [];
            snapshot.forEach(function (childSnapshot) {
              var childData = childSnapshot.val();
              console.log(childData);
              children.push(childData);
            });

            if (children.length === 0) {
              component.setState({
                loginregtext: "i'm new",
                usernameexists: false,
              });
            } else {
              component.setState({
                loginregtext: "login",
                usernameexists: true,
              });
            }
          });
      }
    );
  }

  handleRegisterLogin(e) {
    var component = this;
    var enteredusername = this.state.username;
    var enteredpassword = this.state.password;

    this.setState({
      tryingtologin: true,
    });

    //LOGIN
    if (this.state.usernameexists) {
      console.log("username does exist, loggin in");

      firebase
        .database()
        .ref("/users/")
        .orderByChild("username")
        .equalTo(this.state.username)
        .once("value")
        .then(function (snapshot) {
          console.log("checking username against database");
          var key = "";
          snapshot.forEach(function (childSnapshot) {
            console.log(childSnapshot.key);
            console.log(childSnapshot.value);
            key = childSnapshot.key;
          });
          console.log(key);

          firebase
            .auth()
            .signInWithEmailAndPassword(key + "@recworld.app", enteredpassword)
            .then(function (result) {
              console.log("login success");
              console.log(result);
              component.props.signIn();
              component.setState({
                username: "",
                password: "",
                loginregtext: "i'm new",
                errortext: "",
                error: false,
                usernameexists: false,
                tryingtologin: false,
              });
              successLoginForm()
              component.setState({
                success:true
              })
              component.props.handleUpload();
            })
            .catch(function (error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              component.setState({
                errortext: errorMessage,
              });

              // ...
            });
        });
    } else {
      //REGISTER
      e.preventDefault();

      firebase.auth().currentUser.updateProfile({
        displayName: enteredusername,
      });

      firebase
        .database()
        .ref("users/" + firebase.auth().currentUser.uid)
        .set({
          username: enteredusername,
          //some more user data
        });

      var credential = firebase.auth.EmailAuthProvider.credential(
        firebase.auth().currentUser.uid + "@recworld.app",
        enteredpassword
      );

      firebase
        .auth()
        .currentUser.linkWithCredential(credential)
        .then(function (usercred) {
          var user = usercred.user;
          console.log("Anonymous account successfully upgraded", user);
          component.props.register(enteredusername);
          component.setState({
            username: "",
            password: "",
            loginregtext: "i'm new",
            errortext: "",
            error: false,
            usernameexists: false,
            tryingtologin: false,
          });

          successLoginForm()
          component.setState({
            success:true
          })
          component.props.loginRegisterAction(firebase.auth().currentUser.uid)
          component.props.handleUpload();
        })
        .catch(function (error) {
          component.setState({
            errortext: error.message,
          });
          console.log("enteredusername");
          console.log("Error upgrading anonymous account", error);
        });
    }
  }

  handlePassword(e) {
    this.setState({
      [e.target.name]: e.target.value,
      errortext: "",
    });
  }

  handleCancel() {
    this.setState({
      username: "",
      password: "",
      loginregtext: "i'm new",
      errortext: "",
      error: false,
      usernameexists: false,
      tryingtologin: false,
    });

    cancelLoginForm();

    this.props.closeloginform();
  }

  handleUpload() {
    handlePhotoUpload()
  }

  render() {
    return (
      <div className="logindialog">
        <div className="logindialogimagecontainer">
          <span>
            <span>
              <img
                id="loginimage"
                className="logindialogimage"
                src={starbutton}
                object-fit="scale-down"
              ></img>
            </span>
          </span>
        </div>
        <div
          className="loginform"
          style={{
            maxHeight: !this.state.success ? "800px" : "0px",
            overflow: !this.state.success ? "visible" : "hidden",
          }}
        >
          <div class="floating-label">
            <input
              className="floating-input"
              type="text"
              placeholder=" "
              type="text"
              name="username"
              onBlur={this.handleChange}
              onChange={this.handleChange}
              value={this.state.username}
            ></input>
            <span class="highlight"></span>
            <label>USERNAME</label>
          </div>
          <div class="floating-label">
            <input
              className="floating-input passwordinput"
              type="password"
              placeholder=" "
              onChange={this.handlePassword}
              type="text"
              name="password"
              value={this.state.password}
            ></input>
            <span class="highlight"></span>
            <label>PASSWORD</label>
          </div>
          <span> {this.state.errortext}</span>
          <div className="modalbuttons">
            <button
              onClick={this.handleCancel.bind(this)}
              key="cancel button"
              className="cancelbutton"
            >
              cancel
            </button>
            <button
              onClick={this.handleRegisterLogin.bind(this)}
              className={
                "submitbutton " +
                (this.state.username.trim() && this.state.password.trim()
                  ? "submitshake"
                  : "")
              }
            >
              <span
                style={{ display: this.tryingtologin ? "inherit" : "none" }}
                className="material-icons rotating"
              >
                work
              </span>
              {this.state.loginregtext}
            </button>
          </div>
        </div>
        <div
          className="submitform"
          // style={{ maxHeight: this.props.isAnonymous ? "0px" : "800px" }}
        >
          <div className="modalbuttons">
            <button
              onClick={this.handleCancel.bind(this)}
              key="cancel button"
              className="cancelbutton"
            >
              Cancel
            </button>
            <button
              onClick={this.handleUpload.bind(this)}
              className={"uploadbutton "}
              id="uploadbutton"
            >
              <img src="/images/8-Point-Star_black_void.svg"></img>
              Send
            </button>
          </div>
          {/* <div className="uploadbutton">
          <img id="submitimage" className="uploadimage" src="/images/down-arrow-svgrepo-com (1).svg"></img>
        </div> */}

          {/* <button
            onClick={this.handleCancel.bind(this)}
            key="cancel button"
            className="cancelbutton2"
          >
            cancel
          </button> */}
        </div>
        {/* <div
          className={
            "backgroundlogin " +
            (!this.state.success ? "" : "backgroundloginfadein")
          }
        ></div> */}

        {/* <div className="rodal-mask"></div> */}
      </div>
    );
  }
}

class DialList extends Component {
  constructor(props) {
    super();
    this.state = {
      menuOpen: false,
    };
  }

  toggleMenu() {
    this.setState({
      menuOpen: !this.state.menuOpen
    })
    
  }

  render() {

    return (
      <div className="shortuserlist">
      
      <div onClick={() => this.toggleMenu()} className="listtitle">&#10036;&#xFE0E; DIALER <div className={"arrow " +
                  (this.state.menuOpen
                    ? "arrowrotate"
                    : "")}>&#x25BE;</div></div>
      <div  className={"list " +
                (this.state.menuOpen
                  ? "listexpanded"
                  : "")}>
        <Dialer/>
        {/* {shortUsers} */}
      </div>
      <div className="divider"></div>
      </div>
    );
  }
}

var initialMessage = "Dial someone?"

class Dialer extends Component {
  constructor(props) {
    super();
    this.state = {
      displayName: "",
      number: "",
      isFollowing: true,
      message:initialMessage,
      currentAnimation:anime({})

    };
    this.handleInput = this.handleInput.bind(this)
    this.dialerReport = React.createRef()
  }

  componentDidMount() {
  }

  handleFollow() {
    handleFollow(this.props.uid)
    // this.setState({
    //   isFollowing:true
    // })
  }

  handleUnfollow() {
    handleUnfollow(this.props.uid)
    // this.setState({
    //   isFollowing:false
    // })
  }

  showResponse(message) {
    var component = this

  anime.remove(component.dialerReport.current)
    
    component.setState({
      message:message
    }, function() {

     var animation = anime({
        targets: component.dialerReport.current,
        opacity: [{ value: "0.8", easing: "easeInOutQuad", duration: 300}],
      complete: function() {
        anime({
          targets: component.dialerReport.current,
          opacity: [{ value: "0", easing: "easeInOutQuad", duration: 4000}]})
      }})

    component.setState({
      currentAnimation:animation
    })

    })

  }

  handleInput(event) {
    const component = this

    event.preventDefault()

    console.log("HANDLING INPUT")

    const isnum = /^\d+$/.test(event.target.value)

    if (!isnum) {
      console.log("ISN'T NUMBER")

      event.target.value = ""
      this.showResponse("You can only dial numbers.")
    }

    if(event.target.value.length === 4) {
      const value = event.target.value
      event.target.value = ""
      firebase.database().ref('users/').orderByChild('number').equalTo(value).once('value', function(snapshot) {
        
        var snapshotCount = 0

        snapshot.forEach(function(childSnapshot) {

          const user = childSnapshot.val()
          handleFollow(childSnapshot.key)
          component.showResponse("Followed " + user.username + ".")
          snapshotCount += 1

        })

        if (snapshotCount === 0) {

          component.showResponse("No user with that number.")

        }

      })
    }
  }

  handleFocus(event) {

    if (this.state.message === initialMessage) {
      var animation = anime({targets: this.dialerReport.current,
      opacity: [{ value: "0", easing: "easeInOutQuad", duration: 4000}]})

      this.setState({
        currentAnimation:animation
      })
    }

  }

  render() {
    return (
      <div className="dialercontainer" id={this.props.uid} >
        <div className="dialerreport" ref={this.dialerReport}>{this.state.message}</div>
        <div className="staranddialer">
        <div className="dialerstar">&#10036;&#xFE0E;</div>
        <div className="dialer">

        <input onFocus={event => this.handleFocus(event)} pattern="[0-9]*" inputmode="numeric" onInput={event => this.handleInput(event)} className="dialerinput" type="number"></input>
        <div className="dialerlinecontainer">
          <div className="dialerline"></div>
          <div className="dialerline"></div>
          <div className="dialerline"></div>
          <div className="dialerline"></div>
          </div>
          </div>
          </div>
      </div>
    );
  }
}

class ShortUser extends Component {
  constructor(props) {
    super();
    this.state = {
      displayName: "",
      number: "",
      isFollowing: true
    };
  }

  componentDidMount() {

    var component = this;

    console.log("short user " + this.props.uid)

    firebase
    .database()
    .ref("users/" + this.props.uid)
    .on('value', function (snapshot) {
      //console.log(snapshot.val().username)
      component.setState({
        displayName:snapshot.val().username || "",
        number:snapshot.val().number || ""
      })
    })

    var followingRef = firebase.database().ref('following/' + firebase.auth().currentUser.uid + '/' + this.props.uid)
    followingRef.on('value', function(snapshot) {
      if(snapshot.exists()) {
        component.setState({
          isFollowing:true
        })
      } else {
        component.setState({
          isFollowing:false
        })    
      }
    })

  }

  handleFollow() {
    handleFollow(this.props.uid)
    // this.setState({
    //   isFollowing:true
    // })
  }

  handleUnfollow() {
    handleUnfollow(this.props.uid)
    // this.setState({
    //   isFollowing:false
    // })
  }

  render() {
    return (
      <div className="shortuser" id={this.props.uid} >
        <div onClick={() => this.props.requestUserPhotos(this.props.uid, this.state.displayName)} className="shortusertext">{this.state.displayName}
    <div className="shortusernumber">&#10036;&#xFE0E;{this.state.number}</div>
        </div>
        {/* <div className="shortuserbuttoncontainer"> */}
        <button style={this.state.isFollowing ? {} : {display:'none'}} onClick={this.handleUnfollow.bind(this)} className="shortuserbutton plus">&#65293;</button>
        <button style={!this.state.isFollowing ? {} : {display:'none'}} onClick={this.handleFollow.bind(this)} className="shortuserbutton plus">&#65291;</button>
        <button className="shortuserbutton" onClick={() => this.props.requestUserPhotos(this.props.uid, this.state.displayName)}>&#12297;</button>
        {/* </div> */}
      </div>
    );
  }
}

class ShortUserList extends Component {
  constructor(props) {
    super();
    this.state = {
      uidList: [],
      menuOpen: false
    };
  }

  componentDidMount() {

    function getFollowingList(component, uid) {

      firebase
      .database()
      .ref("following/" + uid)
      .once('value', function (snapshot) {

        var newUids = []

        console.log("Loading new followers")

        snapshot.forEach(function (childSnapshot) {
          newUids.push(childSnapshot.key)
          console.log(childSnapshot.key)
        })

        component.setState({
          uidList:newUids,
        })

      })
    }


    const component = this
    firebase.auth().onAuthStateChanged(function (user) {
      
      getFollowingList(component, user.uid)

      firebase
      .database()
      .ref("following/" + user.uid)
      .on('child_added', function (snapshot) {
        getFollowingList(component, user.uid)
      })
    })
  }

  toggleMenu() {
    this.setState({
      menuOpen: !this.state.menuOpen
    })
  }

  render() {
    var shortUsers = this.state.uidList.map((d) => 
    <ShortUser requestUserPhotos={this.props.requestUserPhotos} setCurrentTitle={this.props.setCurrentTitle} accountForm={this.props.accountForm} currentTitle={this.props.currentTitle} uid={d} key={d}></ShortUser>);

    return (
      <div className="shortuserlist">
      
      <div onClick={() => this.toggleMenu()} className="listtitle">&#8942;&#xFE0E; FOLLOWING <div className={"arrow " +
                  (this.state.menuOpen
                    ? "arrowrotate"
                    : "")}>&#x25BE;</div></div>
      <div  className={"list " +
                (this.state.menuOpen
                  ? "listexpanded"
                  : "")}>
        {/* <Dialer/> */}
        {shortUsers}
      </div>
      <div className="divider"></div>
      </div>
    );
  }
}

class Notification extends Component {
  constructor(props) {
    super();
    this.state = {
      notificationMessage: ""
    };
  }

  componentDidMount() {
    if (this.props.notification.type === "reply") {

      const message = this.props.notification.creatorDisplayName + " replied"

      this.setState({
        notificationMessage: message
      })

    } else if (this.props.notification.type === "also") {

      const message = this.props.notification.creatorDisplayName + " also replied to " + this.props.notification.originalCreatorDisplay

      this.setState({
        notificationMessage: message
      })

    }
  }

  render() {
    return (
      <div className="shortuser" id={this.props.uid} >
        <div style={this.props.notification.status === "unread" ? {'opacity':1} : {'opacity':0}} className="notificationDot onNotification"></div>
        <img className="notificationImage" src={this.props.notification.photoUrl}></img>
    <div onClick={() => this.props.requestSinglePhoto(this.props.notification.photoUid, this.props.notification.originalCreatorDisplay || "")} className="shortusertext">{this.state.notificationMessage}</div>
        {/* <div className="shortuserbuttoncontainer"> */}
        <button className="shortuserbutton" onClick={() => this.props.requestSinglePhoto(this.props.notification.photoUid, this.props.notification.originalCreatorDisplay || "")}>&#12297;</button>
        {/* </div> */}
      </div>
    );
  }
}

class NotificationList extends Component {
  constructor(props) {
    super();
    this.state = {
      notificationList: [],
      menuOpen: false
    };
  }

  componentDidMount() {

    // function getFollowingList(component, uid) {

      // firebase
      // .database()
      // .ref("notifications/" + uid)
      // .once('value', function (snapshot) {

      //   var newUids = []
      //   snapshot.forEach(function (childSnapshot) {
      //     newUids.push(childSnapshot.key)
      //     console.log(childSnapshot.key)
      //   })

      //   component.setState({
      //     uidList:newUids,
      //   })

      // })
    // }


    // const component = this
    // firebase.auth().onAuthStateChanged(function (user) {

    //   if(user.isAnonymous) {
    //     this.setState({
    //       notificationList:[]
    //     })
    //     return
    //   }
    //   firebase
    //   .database()
    //   .ref("notifications/" + user.uid).limitToLast(50)
    //   .on('child_added', function (snapshot) {
    //     console.log("Notification")
    //     console.log(snapshot.val())
    //     component.setState({
    //       notificationList: component.state.notificationList.push(snapshot.val())
    //     })
    //   })
    // })
  }

  toggleMenu() {
    this.setState({
      menuOpen: !this.state.menuOpen
    })
    
  }

  render() {
    var notifications = this.props.notificationList.map((d) => 
    <Notification key={d.key} uid={d.key} requestSinglePhoto={this.props.requestSinglePhoto} currentTitle={this.props.currentTitle} notification={d.val()}></Notification>);

    return (
      <div className="shortuserlist">
      
      <div onClick={() => this.toggleMenu()} className="listtitle">&#9900;&#xFE0E; NOTIFICATIONS <div style={this.props.newNotifications ? {opacity:1}: {opacity:0}}  className="notificationDot menuNotificationDot"></div> <div className={"arrow " +
                  (this.state.menuOpen
                    ? "arrowrotate"
                    : "")}>&#x25BE;</div></div>
      <div  className={"list " +
                (this.state.menuOpen
                  ? "listexpanded"
                  : "")}>
        {notifications}
      </div>
      <div className="divider"></div>
      </div>
    );
  }
}

function transitionPhotosRight(photos) {
  for(var photo of photos) {
    // anime({
    //   targets: photo.material,
    //   opacity: [
    //     {
    //       value: 0,
    //       easing: "easeInQuad",
    //       duration: transitionTime - 100,
    //     },
    //   ],
    // });

    anime({
      targets: photo.rotation,
      z: [
        {
          value: 0.15,
        },
      ],
      easing: "spring(1, 80, 20, 0)",
      duration: 3000
    });
    anime({
      targets: photo.position,
      x: [
        {
          value: photo.position.x + 5,
          easing: "spring(1, 80, 20, 0)",
          duration: transitionTime * 200,
          delay: anime.random(0,150)
        },
      ],
      y: [
        {
          value: photo.position.y - 1.5,
          easing: "spring(1, 80, 20, 0)",
          duration: transitionTime * 200,
        },
      ],
    });
  }
}

function transitionPhotosLeft(photos) {
  for(var photo of photos) {
    // anime({
    //   targets: photo.material,
    //   opacity: [
    //     {
    //       value: 0,
    //       easing: "easeInQuad",
    //       duration: transitionTime - 100,
    //     },
    //   ],
    // });

     anime({
        targets: photo.rotation,
        z: [
          {
            value: -0.15,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 3000
      });

    anime({
      targets: photo.position,
      x: [
        {
          value: photo.position.x - 5,
          easing: "spring(1, 80, 20, 0)",
          duration: transitionTime * 200,
          delay: anime.random(0,150)
        },
      ],
      y: [
        {
          value: photo.position.y + 1.5,
          easing: "spring(1, 80, 20, 0)",
          duration: transitionTime * 200,
        },
      ],
    });
  }
}

var uploadStyle= "submit"

class App extends Component {
  constructor(props) {
    super();
    this.state = {
      currentusername: "",
      currentuid: "",
      loginformopen: false,
      loginbuttonvisible: false,
      isAnonymous: true,
      loggedInUser: {},
      currentUser: {},
      currentTitle: "",
      currentTitleUid: "",
      minimalUI: false,
      accountFormOpen: false,
      currentTitleUidFollowing: true,
      mode: "all",
      firstLoad:true,
      newNotifications:false,
      hamburgerHidden:true,
      userNumber:""
    };
    window.App = this;
    this.backTitle = React.createRef()
    this.loginForm = React.createRef()
    this.accountForm = React.createRef()
    this.goBack = this.goBack.bind(this)
    this.submitInput = React.createRef()
    this.replyInput = React.createRef()
    this.noFollowingNotification = React.createRef()
  }

  componentDidMount() {
    //this.requestPublicFeed()

    var component = this;

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        console.log("AUTH STATE CHANGED");
        console.log(user);
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;

        console.log(JSON.stringify(firebase.auth().currentUser))
        component.setState(
          {
            isAnonymous: isAnonymous,
            currentUser: JSON.stringify(firebase.auth().currentUser)
          },
          function () {}
        );

        if (!user.isAnonymous) {

          component.loginRegisterAction(user.uid)

        }

        getFollowing(user.uid).then( function() {
          if (component.state.firstLoad) {
            component.requestPublicFeed()
            component.setState({
              firstLoad:false
            })
          }
        }
        )

        // ...
      } else {
        // User is signed out.
        // ...
        firebase
          .auth()
          .signInAnonymously()
          .catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log(errorMessage);
          });

          component.setState({

            hamburgerHidden:true

          })

      }
      // ...
    });
  }

  loginRegisterAction(uid) {

    const component = this 

    component.createNotificationsListener(uid)

    firebase
    .database()
    .ref("users/" + uid)
    .once('value', function (snapshot) {
      console.log("firebase user ref")
      console.log(snapshot.val())
      component.setState({
        currentUser:firebase.auth().currentUser.displayName,
        isAnonymous:false,
        loggedInUser:snapshot.val(),
        hamburgerHidden:false,
        userNumber: snapshot.val().number || ""
      })
    })

    firebase
    .database()
    .ref("users/" + uid)
    .on('child_added', function (snapshot) {

      if(snapshot.key === "number") {
        component.setState({
          userNumber: snapshot.val()
        })
      }

    })

  }

  createNotificationsListener(uid) {
    const component = this 
    const newNotificationsRef = firebase.database().ref('/notifications/' + uid).orderByChild('status').equalTo('unread').limitToLast(50)
    newNotificationsRef.on("child_added", function(snapshot) {
      component.setState({
        newNotifications:true
      })
      component.accountForm.current.requestNotifications()
    })
  }

  setHamburgerHidden() {
    this.setState({
      hamburgerHidden: true
    })
  }

  setHamburgerShow() {
    this.setState({
      hamburgerHidden: false
    })
  }


  setNewNotifications() {
    this.setState({
      newNotifications:true
    })
  }

  setNotificationsRead() {
    this.setState({
      newNotifications:false
    })
  }

  loginFormShow() {
    this.setState({
      loginformopen: true,
    });
  }

  loginFormHide() {
    this.setState({
      loginformopen: false,
    });
  }

  register(username) {
    this.setState({
      currentusername: username,
      loginformopen: false,
    });
  }
  signIn() {
    this.setState({
      loginformopen: false,
    });
  }



  requestPrivateFeed() {
    this.setState({
      mode:"private"
    })
    requestPrivateFeed()

    if (Object.entries(followingList).length === 0) {
      anime({
        targets: this.noFollowingNotification.current,
        opacity: [{ value: "0.8", easing: "easeInOutQuad", duration: 300},
        { value: "0", easing: "easeInOutQuad", duration: 4000}
      ]})
    }
  }

  requestPublicFeed() {
    this.setState({
      mode:"all"
    })
    requestLatestPhotos()
  }

  signOut() {
    signOut()
  }

  showAccountForm() {
    this.minizeUI()
    this.accountForm.current.showForm()
    this.setState({
      accountFormOpen:true
    })
    // this.accountForm.current.accountForm.current.classList.remove('sentBack')
  }

  dismissAccountForm() {
    // this.minizeUI()
    // this.accountForm.current.showForm()
    this.setState({
      accountFormOpen:false
    })
    // this.accountForm.current.accountForm.current.classList.remove('sentBack')
  }

  goBack() {
    var backDict = backDicts.pop()
    var showingAccountForm = false
    if (backDict !== undefined) {

      transitionPhotosRight(photos)

      setTimeout(function() { 
        clearFeed()
        setUpNewFeed(backDict.photosList,backDict.stickers, animationType.fromleft, backDict.scroll)
      }, transitionTime - 100);

      this.setCurrentTitle(backDict.title, backDict.uid, "back")

      if (backDict.div) {
        backDict.div.classList.remove('sentBack')
        if (backDict.div.className.includes("accountform")) {
          showingAccountForm = true
          this.setState({
            accountFormOpen:true
           })
        }
      }
    }

    if (backDicts.length === 0 && !showingAccountForm) {
      this.setState({
        minimalUI:false,
        currentTitle:"",
        currentTitleUid:"",
      })
    }

    if (backDicts.length === 0 && this.state.isAnonymous === false) {
      this.setState({
        hamburgerHidden:false
      })
    }

  }

  goForward(newTitle, newUid, backDiv, newPhotosFunction, functionArgument, photos) {
      
    addToBackDict(currentPhotosList, stickers, backDiv, this.state.currentTitle, this.state.currentTitleUid)

    transitionPhotosLeft(photos)

    setTimeout(function() { 
       newPhotosFunction(functionArgument)
    }, transitionTime - 100);    

    this.setCurrentTitle(newTitle, newUid, "forward")

    this.setState({
      hamburgerHidden:true
    })

  }

  // setCurrentTitle(title,uid,direction) {
  //   var component = this
  //   if (direction === "forward" && backDicts.length > 1) {

  //     setTimeout(function() {
  //       component.setState({
  //       currentTitle:title,
  //        currentTitleUid: uid
  //       })
  //     }, 300)

  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {value: '0px'},
  //         {
  //           value: "-20px",
  //           easing: "easeInQuad",
  //           duration: 300,
  //         },
  //         {value:'20px'},
  //         {
  //           value: "0px",
  //           easing: "easeOutQuad",
  //           duration: 300,
  //         }
  //       ],
  //       opacity: [
  //         {value: 1},
  //         {
  //           value: 0,
  //           easing: "easeInQuad",
  //           duration: 300,
  //         },
  //         {value:0},
  //         {
  //           value: 1,
  //           easing: "easeOutQuad",
  //           duration: 300,
  //         }
  //       ]
  //     })
  //   }
  //   if (direction === "forward" && backDicts.length === 1) {

  //     setTimeout(function() {
  //       component.setState({
  //       currentTitle:title,
  //        currentTitleUid: uid
  //       })
  //     }, 0)

  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {value:'20px'},
  //         {
  //           value: "0px",
  //           easing: "easeOutQuad",
  //           duration: 300,
  //         }
  //       ],
  //       opacity: [
  //         {value:0},
  //         {
  //           value: 1,
  //           easing: "easeOutQuad",
  //           duration: 300,
  //         }
  //       ]
  //     })
  //   }
  // }

  setCurrentTitle(title, uid) {
    console.log("TITLE " + title)
    this.setState({
      currentTitle:title,
      currentTitleUid: uid
    }, () => {
      this.checkIfFollowingTitleUid()})
  }

  // setCurrentTitle(title, uid, direction) {

  //   var component = this
  //   if (direction === "forward" && backDicts.length > 0) {
  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {
  //           value: "-20px",
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //         }
  //       ],
  //       opacity: [
  //         {
  //           value: 0,
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //           complete: function() {
  //               component.setState({
  //       currentTitle:title,
  //       currentTitleUid: uid
  //     }, () => {
  //       component.checkIfFollowingTitleUid()
  //       anime({
  //         targets: component.backTitle.current,
  //         translateX: [
  //           {
  //             value: "20px",
  //           },
  //           {
  //             value: "0px",
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }
  //         ],
  //         opacity: [
  //           {value:0},
  //           {
  //             value: 1,
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }]
  //         })
  //     })
  //           }
  //         }
  //       ]
  //     });
  //   }
  //   if (direction === "forward" && backDicts.length === 0) {
  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {
  //           value: "-20px",
  //           easing: "easeInOutQuad",
  //           duration: 0,
  //         }
  //       ],
  //       opacity: [
  //         {
  //           value: 0,
  //           easing: "easeInOutQuad",
  //           duration: 0,
  //           complete: function() {
  //               component.setState({
  //       currentTitle:title,
  //       currentTitleUid: uid
  //     }, () => {
  //       component.checkIfFollowingTitleUid()
  //       anime({
  //         targets: component.backTitle.current,
  //         translateX: [
  //           {
  //             value: "20px",
  //           },
  //           {
  //             value: "0px",
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }
  //         ],
  //         opacity: [
  //           {value:0},
  //           {
  //             value: 1,
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }]
  //         })
  //     })
  //           }
  //         }
  //       ]
  //     });
  //   }
  //   if (direction === "back" && backDicts.length > 0) {
  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {
  //           value: "20px",
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //         }
  //       ],
  //       opacity: [
  //         {
  //           value: 0,
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //           complete: function() {
  //               component.setState({
  //       currentTitle:title,
  //       currentTitleUid: uid
  //     }, () => {
  //       component.checkIfFollowingTitleUid()
  //       anime({
  //         targets: component.backTitle.current,
  //         translateX: [
  //           {
  //             value: "-20px",
  //           },
  //           {
  //             value: "0px",
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }
  //         ],
  //         opacity: [
  //           {value:0},
  //           {
  //             value: 1,
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }]
  //         })
  //     })
  //           }
  //         }
  //       ]
  //     });
  //   }

  //   if (direction === "back" && backDicts.length === 0) {
  //     anime({
  //       targets: this.backTitle.current,
  //       translateX: [
  //         {
  //           value: "20px",
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //         }
  //       ],
  //       opacity: [
  //         {
  //           value: 0,
  //           easing: "easeInOutQuad",
  //           duration: 300,
  //           complete: function() {
  //               component.setState({
  //       currentTitle:title,
  //       currentTitleUid: uid
  //     }, () => {
  //       component.checkIfFollowingTitleUid()
  //       anime({
  //         targets: component.backTitle.current,
  //         translateX: [
  //           {
  //             value: "-20px",
  //           },
  //           {
  //             value: "0px",
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }
  //         ],
  //         opacity: [
  //           {value:0},
  //           {
  //             value: 1,
  //             easing: "easeInOutQuad",
  //             duration: 300
  //           }]
  //         })
  //     })
  //           }
  //         }
  //       ]
  //     });
  //   }
  // }

  submitInputOnChange(event) {
    uploadStyle= "submit"
    submitOnChange(this.submitInput.current, event)
    console.log("Submit input")
  }

  replyInputOnChange(event) {
    uploadStyle= "reply"
    replyOnChange(this.replyInput.current, event)
  }

  minizeUI() {
    this.setState({
      minimalUI:true
    })
  }

  maximizeUI() {
    this.setState({
      minimalUI:false
    })
  }

  closeAccountButton() {
    this.accountForm.current.dismissForm()
  }

  handleUpload() {

    const component = this

    setTimeout(function() {
      if (uploadStyle === "submit") {
        handlePhotoUpload(component.submitInput.current)
      } else if (uploadStyle === "reply") {
        handleReplyUpload(component.replyInput.current)
      }
    }, 100)
  }

  checkIfFollowingTitleUid() {
    var component = this

    if( this.state.currentTitleUid !== "") {
      var newUidRef= firebase.database().ref('/following/' + firebase.auth().currentUser.uid + '/' + this.state.currentTitleUid)
      newUidRef.once('value', function(snapshot) {
        console.log(snapshot)

        if (snapshot.exists()) {
          component.setState({
            currentTitleUidFollowing:true
          })

      } else {
        component.setState({
          currentTitleUidFollowing:false
        })
      }
      })
    }
  }

  handleTitleFollow() {
    handleFollow(this.state.currentTitleUid)
    this.setState({
      currentTitleUidFollowing:true
    })
  }

  handleTitleUnfollow() {
    handleUnfollow(this.state.currentTitleUid)
    this.setState({
      currentTitleUidFollowing:false
    })
  }

  shineButtonClick() {
    this.submitInput.current.click()
  }

  render() {
    return (
      <div>
            <div class="title" >
              <div className="titleBar">
              <div  style={this.state.hamburgerHidden ? {maxWidth:0, opacity:0, marginRight:0}: {maxWidth:75,opacity:1}} className="titleMenu">
    
    <Hamburger size={26} distance={"large"} onToggle={toggled => {
      if (toggled) {
        this.showAccountForm()
      } else {
        this.accountForm.current.dismissForm()
      }
    }}></Hamburger>
    <div style={this.state.newNotifications ? {opacity:1}: {opacity:0}} className="notificationDot accountNotificationDot"></div>
        </div>
    <div class="titletext" >SUNSHINE</div>

      </div>
    <div id="progress" className="progress">
    </div>
    {/* <button className="modebutton closeAccountButton" onClick={this.closeAccountButton.bind(this)} style={this.state.accountFormOpen ? {opacity:1,pointerEvents:"all", overflow:"auto", bottom: '15px'}: {opacity:0,pointerEvents:"none",overflow:"hidden" }}>&#10005;</button> */}

    <div className="backTitle " ref={this.backTitle} style={this.state.currentTitle ? {'opacity':'1', 'max-height':100} : {'opacity':'0', 'max-height':0, 'margin-bottom':'-10px'}}><div onClick={this.goBack.bind(this)} className="backButton" style={this.state.currentTitle ? {'display':'inline-block'} : {'display' :'none'}}>&#x27F5;&#xFE0E;</div>{this.state.currentTitle ? this.state.currentTitle : ""}
    </div>

    <AccountForm userNumber={this.state.userNumber} setHamburgerHidden={this.setHamburgerHidden.bind(this)} newNotifications={this.state.newNotifications} setNotificationsRead={this.setNotificationsRead.bind(this)} goForward={this.goForward.bind(this)} loginForm={this.loginForm} dismissAccountForm={this.dismissAccountForm.bind(this)} showAccountForm={this.showAccountForm.bind(this)} accountFormOpen={this.state.accountFormOpen} maximizeUI={this.maximizeUI.bind(this)} setCurrentTitle={this.setCurrentTitle.bind(this)} ref={this.accountForm} loggedInUser={this.state.loggedInUser} currentUser={this.state.currentUser} />

    </div>

    <div className="modeBar" style={this.state.minimalUI ? {opacity:0,pointerEvents:"none"}: {opacity:1}}>
    <button className={"modebutton globe " + (this.state.mode === "all"
      ? "modebuttonactive"
      : "")} id="requestpublic" style={this.state.isAnonymous || this.state.minimalUI ? {opacity:0,pointerEvents:"none"}: {opacity:1}} onClick={this.requestPublicFeed.bind(this)}><img src={globeimage}/></button>
    <button className={"modebutton private " + (this.state.mode === "private"
      ? "modebuttonactive"
      : "")} style={this.state.isAnonymous || this.state.minimalUI ? {opacity:0,pointerEvents:"none"}: {opacity:1}} onClick={this.requestPrivateFeed.bind(this)}><img src={smileyimage}/></button>
    {/* <button className="modebutton account" style={this.state.isAnonymous ? {opacity:0,pointerEvents:"none"}: {opacity:1}} onClick={this.showAccountForm.bind(this)}><img src={accountimage}/><div style={this.state.newNotifications ? {opacity:1}: {opacity:0}} className="notificationDot accountNotificationDot"></div></button> */}

    <div onClick={this.shineButtonClick.bind(this)} className="shinebutton" id="shinebutton" style={this.state.minimalUI ? {opacity:0,pointerEvents:"none"}: {opacity:1, pointerEvents:"all"}}>
      <img
        src={starbutton}
      />
    </div>


    </div>
      <div id="root">
        <div className="threejs" style={this.state.accountFormOpen ? {opacity:0,pointerEvents:"none",overflow:"hidden" }: {opacity:1,pointerEvents:"all", overflow:"auto"}}>
          <ThreeJS />
        </div>

      </div>
      <LoginForm
      loginRegisterAction={this.loginRegisterAction.bind(this)}
          ref={this.loginForm}
          closeloginform={this.loginFormHide.bind(this)}
          register={this.register.bind(this)}
          signIn={this.signIn.bind(this)}
          isAnonymous={this.state.isAnonymous}
          handleUpload={this.handleUpload.bind(this)}
        />
            <button className="titleFollowButton" onClick={this.handleTitleFollow.bind(this)} style={this.state.currentTitleUid && !this.state.currentTitleUidFollowing ? {'opacity':1, pointerEvents:'all', bottom:'2px'} : {'opacity':0, pointerEvents:'none', bottom:'-100px'}}>Follow</button>
    <button className="titleFollowButton" onClick={this.handleTitleUnfollow.bind(this)} style={this.state.currentTitleUid && this.state.currentTitleUidFollowing ? {'opacity':1, pointerEvents:'all', bottom:'2px'} : {'opacity':0, pointerEvents:'none', bottom:'-100px'}}>Unfollow</button>
    <div className="replyinput">
      <input style={{display:"none"}} onChange={this.replyInputOnChange.bind(this)} ref={this.replyInput} type="file" accept="image/*" id="reply-input"/>
      <label for="reply-input"></label>
    </div>
    <input style={{display:"none"}} onChange={this.submitInputOnChange.bind(this)} ref={this.submitInput} type="file" accept="image/*" id="file-input"/>
    <label for="file-input"></label>
    <div ref={this.noFollowingNotification} className="noFollowersNotification">You don't follow anyone yet.</div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root2");
ReactDOM.render(<App />, rootElement);
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();

function interpolateColors(color1, color2, ratio) {
  var hex = function (x) {
    x = x.toString(16);
    return x.length == 1 ? "0" + x : x;
  };

  var r = Math.ceil(
    parseInt(color1.substring(0, 2), 16) * ratio +
      parseInt(color2.substring(0, 2), 16) * (1 - ratio)
  );
  var g = Math.ceil(
    parseInt(color1.substring(2, 4), 16) * ratio +
      parseInt(color2.substring(2, 4), 16) * (1 - ratio)
  );
  var b = Math.ceil(
    parseInt(color1.substring(4, 6), 16) * ratio +
      parseInt(color2.substring(4, 6), 16) * (1 - ratio)
  );

  var middle = hex(r) + hex(g) + hex(b);
  return middle;
}

function removeItemAll(arr, value) {
  var i = 0;
  while (i < arr.length) {
    if (arr[i] === value) {
      arr.splice(i, 1);
    } else {
      ++i;
    }
  }
  return arr;
}

const scrollToTop = () => {
  // const c = document.documentElement.scrollTop || document.body.scrollTop;
  // if (c > 0) {
  //   window.requestAnimationFrame(scrollToTop);
  //   window.scrollTo(0, c - c / 8);
  // }

  $('html, body').animate({scrollTop:0},'500');

};

function paginateArray(array, page_size, page_number) {
  return array.slice(page_number * page_size, page_number * page_size + page_size);
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}