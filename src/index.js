import ReactDOM from "react-dom";
import "./index.css";
import * as serviceWorker from "./serviceWorker";
import * as THREE from "three";
import $ from "jquery";
import React, { Component } from "react";
import roughnessmap from "./images/Plastic_001_ROUGH.jpg";
import anime from "animejs/lib/anime.es.js";
import replyimage from "./images/noun_Reply_70802.png";
import starimage from "./images/images.png";
import starimagealpha from "./images/imagesalpha.png";
import globeimage from "./images/Globe-5.svg";
import stickerbg from "./images/stickerbg.png";
import envmap from "./images/envmap.jpg";
import envmap2 from "./images/envmap2.jpg";
import scratchmap from "./images/scratchtexture.jpg";
import papermap from "./images/paper.jpeg";
import papermap2 from "./images/paper.jpg";

import holographicmap from "./images/MWHG50-XLARGE.jpg";
import { SpotLight, MeshNormalMaterial, TorusKnotBufferGeometry } from "three";
import { FresnelShader } from "./shaders/FresnelShader.js";
import { Cloudinary } from "cloudinary-core"; // If your code is for ES6 or higher
import firebase from "firebase";
import { Interaction } from "three.interaction";
// import Canvas from './canvas';
import CanvasDraw from "react-canvas-draw";
import SignatureCanvas from 'react-signature-canvas'


import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import scenedata from "./models/daisy.glb";

const type = {reply : "reply", sticker : "sticker", feedphoto : "feedphoto", newphoto: "newphoto"}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera()
var imagewidth = 2;
var feedheight = 0;
var bottomoffeed = 0;
var photozposition = 0.75;
console.log("Window width");

var photos = [];
var currentPhotosList = []
var currentPage = 0
var replies = {};

var areRepliesVisible = {};
var yRepliesDifferential = {};
var replyLine = {};
var replyMeshes = {};

var stickers = []
var stickerIndex = 0
var stickerCount = 0

var backDicts = []

var primaryorange = "FDB943";
var primarywhite = "E6E3DA";
var primarydarkorange = "fe5b30"

console.log(window.innerWidth);
if (window.innerWidth < 737) {
  imagewidth = 1.8;
}

var textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = "Anonymous";

var grimetexture = async function getGrimeTexture() {
  textureLoader.load(roughnessmap, function (texture) {
    return Promise.resolve(texture);
  });
};
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
    }
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
        true
      );
    };
  }
}

function uploadFile(file, width, height, firebaseref, reply) {
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
              false,
              true,
              false
            );

            scrollToTop();
          });
        });
      } else {
        //Reply action

        var originalphoto = scene.getObjectByName(replyref);

        var newphotoreference = photosRef.push(newPhoto).then((reference) => {
          //ref.child(snapshot.key).update({"id": snapshot.key})
          reference.once("value", function (snapshot) {
            console.log(snapshot.val());
            var photodata = snapshot.val();

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
              false,
              false,
              true
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
      stickers.push(childSnapshot.val())
    })
    console.log(stickers)
    shuffleArray(stickers)
    return Promise.resolve(stickers)
  })

}

async function requestUserPhotos(uid) {
  clearFeed()

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
        setUpNewFeed(photosList)
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
        setUpNewFeed(photosList)
      })
      
      
      // currentPhotosList = photosList

      // currentPage = 0
      // generateFeed(paginateArray(currentPhotosList,20,currentPage));
}

function setUpNewFeed(photosList, stickers) {
  currentPhotosList = photosList
  currentPage = 0

  scrollToTop()

  generateFeed(paginateArray(currentPhotosList,20,currentPage), stickers);
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

  areRepliesVisible = {};
  yRepliesDifferential = {};
  replyLine = {};
   replyMeshes = {};
   stickerIndex = 0
   stickerCount = 0
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
          setUpNewFeed(photosList)
        }
      })
    });


  });
}

var daisyCount = -1;
var daisyRight = true;

function generateFeed(photosList) {
  console.log("Generating feed")
 //clearFeed()

  var yvalue = 0;


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

    createPhoto(photo.url, 0, yvalue, username, photo, true, false, false);

    if (daisyCount === 0) {
      addDaisy(
        imagewidth / 2 + 0.35,
        yvalue + (imagewidth * (photo.height / photo.width)) / 2 - 0.05,
        daisyRight
      );
      daisyRight = !daisyRight;
    } else if (daisyCount === 3) {
      addDaisy(
        -imagewidth / 2 - 0.3,
        yvalue + (imagewidth * (photo.height / photo.width)) / 4,
        daisyRight
      );
    } else if (daisyCount === 5) {
      addDaisy(
        -imagewidth / 2 - 0.3,
        yvalue + (imagewidth * (photo.height / photo.width)) / 4,
        daisyRight
      );
      daisyRight = !daisyRight;
    } else if (daisyCount === 6) {
      daisyCount = -1;
    }

    daisyCount = daisyCount + 1;

    yvalue = yvalue - (imagewidth * (photo.height / photo.width)) / 2;

    if (stickerIndex === 2) {
      yvalue = yvalue - 0.5
      yvalue = yvalue - (imagewidth * (3/4)) / 2.3
      createSticker(yvalue, stickers[stickerCount])
      yvalue = yvalue - (imagewidth * (3/4)) / 2.3
      stickerCount += 1
    }

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

function createSticker(yvalue, stickerobject) {
  var geometry = new THREE.BoxGeometry(1, 1, 0.000001);
  var cube = new THREE.Mesh(geometry);
  var material = new THREE.MeshStandardMaterial()
  material.roughness = 0
  cube.type = type.sticker
  var url = stickerobject.stickerimage
  cube.material = material
  cube.castShadow = true

  var textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "Anonymous";
  textureLoader.load(papermap, function (texture) {
    console.log("TEXTURE LOADED", texture);
    cube.material.normalMap = texture
    cube.material.needsUpdate = true;
    // cube.material = material;
  })

  textureLoader.load(papermap2, function (texture) {
    console.log("TEXTURE LOADED", texture);
    cube.material.roughnessMap = texture
    cube.material.needsUpdate = true;
    // cube.material = material;
  })

  textureLoader.load(url, function (maptexture) {
    console.log("texture loaded");
    cube.material.map = maptexture;
    cube.material.needsUpdate = true;
  });

  scene.add(cube)

  cube.position.y = yvalue
  cube.position.z = 0.05
  cube.position.x = -imagewidth/3.75

  cube.rotation.y = -0.005
  cube.rotation.z = 0.1

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
  const distanceThreshhold = 10
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

        var badge = addBadge(value.creatorusername, color, value.object,value.creator);
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

        textureLoader.load(roughnessmap, function (texture) {
          console.log("TEXTURE LOADED", texture);
          //value.object.material.roughnessMap = texture;

          textureLoader.load(value.url, function (maptexture) {
            console.log("texture loaded");
            var material = new THREE.MeshStandardMaterial();
            material.map = maptexture;
            material.roughnessMap = texture;

            value.object.material = material;
            // value.object.material.map = maptexture;
            // value.object.material.needsUpdate = true;
          });
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
            duration: 750,
          },
        ],
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
        value: imagewidth / 2 + 0.08,
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

  var scale = 0.55;
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
  });
}

function drawReplySymbol() {
  var path = new THREE.Path();
  var xoffset = 0.425;
  var yoffset = -0.35;
  var multiplier = 1;
  path.moveTo(-0.1 + xoffset * multiplier, 0.1 + yoffset * multiplier);
  path.quadraticCurveTo(
    0 + xoffset * multiplier,
    0.45 + yoffset * multiplier,
    -0.5 + xoffset * multiplier,
    0.5 + yoffset * multiplier
  );
  path.lineTo(-0.5 + xoffset * multiplier, 0.6 + yoffset * multiplier);
  path.lineTo(-0.75 + xoffset * multiplier, 0.4 + yoffset * multiplier);
  path.lineTo(-0.5 + xoffset * multiplier, 0.2 + yoffset * multiplier);
  path.lineTo(-0.5 + xoffset * multiplier, 0.3 + yoffset * multiplier);
  path.quadraticCurveTo(
    -0.2 + xoffset * multiplier,
    0.3 + yoffset * multiplier,
    -0.1 + xoffset * multiplier,
    0.1 + yoffset * multiplier
  );

  //path.lineTo( 1, 1 );

  var points = path.getPoints();

  var geometry = new THREE.BufferGeometry().setFromPoints(points);

  var material = new THREE.LineBasicMaterial({ color: 0x00000 });

  // Create the final object to add to the scene
  var splineObject = new THREE.Line(geometry, material);

  return splineObject;
  // scene.add(splineObject);
  // splineObject.position.set(0, 0, 3);
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
    photozposition - 0.3
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
  var geometry = new THREE.BoxGeometry(1, 1, 0.000001);

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
        duration: 350,
      },
    ],
  });
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

  var geometry = new THREE.PlaneGeometry(0.1, 0.1, 0.1);
  var material = new THREE.MeshStandardMaterial();
  material.metalness = 0.5;
  material.roughness = 0.1;
  material.transparent = true;

  // eslint-disable-next-line no-loop-func
  textureLoader.load(starimage, function (texture) {
    material.map = texture;
    material.roughnessMap = texture;
    textureLoader.load(starimagealpha, function (texture) {
      material.alphaMap = texture;
      var object = new THREE.Mesh(geometry, material);

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
    });
  });
}


function createPhoto(
  url,
  xposition,
  yposition,
  username,
  photo,
  feedphoto,
  newphoto,
  newreply
) {
  var geometry = new THREE.BoxGeometry(1, 1, 0.000001);
  var cube = new THREE.Mesh(geometry);
  var material = new THREE.MeshStandardMaterial()
  cube.material = material

  var height = photo.height;
  var width = photo.width;
  var key = photo.key;
  var replyholder = new THREE.Mesh();

  var textureLoader = new THREE.TextureLoader();
  textureLoader.crossOrigin = "Anonymous";
  textureLoader.load(roughnessmap, function (texture) {
    console.log("TEXTURE LOADED", texture);

      cube.material.roughnessMap = texture
      cube.material.needsUpdate = true
    });
    // cube.rotation.x = -0.1;
    // cube.rotation.y = -0.2;

    cube.scale.y = imagewidth * (height / width);
    cube.scale.x = imagewidth;
    cube.castShadow = true;
    cube.name = key;
    scene.add(cube);

    cube.position.y = yposition;
    cube.position.x = xposition;

    if (feedphoto) {
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

      cube.url = url
      cube.loaded = false

      addStarsRefs(cube,key)
      addPhotoClickEvent(cube)
      addBadge(username, "#fe5b30", cube, photo.creator);


    } else if (newphoto) {
      cube.position.z = photozposition;
      cube.position.x = xposition - 5
      cube.position.y = yposition + 3
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
            value: yposition,
          },
        ],
        y: [
          {
            value: xposition,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 800 + (-yposition * 100),
        complete: function () {
          var addRandomNumber = (Math.random() * 0.1) / 2;
          var addTimeRandomNumber = Math.random() * 200;

          addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);
        },
      });

      cube.url = url
      cube.loaded = false

      addStarsRefs(cube,key)
      addPhotoClickEvent(cube)
      addBadge(username, "#fe5b30", cube, photo.creator);


    } else if (newreply) {
      cube.position.x = xposition + 5;
      cube.position.y = yposition + 3;
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
        y: [
          {
            value: yposition,
          },
        ],
        easing: "spring(1, 80, 20, 0)",
        duration: 2000,
        complete: function () {
          var addRandomNumber = (Math.random() * 0.1) / 2;
          var addTimeRandomNumber = Math.random() * 200;

          addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);
        },
      });

      textureLoader.load(url, function (texture) {
        console.log("TEXTURE LOADED", texture);
    
          cube.material.map = texture
          cube.material.needsUpdate = true
        });

        var color =
      "#" +
      interpolateColors(primarywhite, "3773B3", 0.25);
      addBadge(username, color, cube, photo.creator);

    }

    //cube.position.z = photozposition;

    photos.push(cube);

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




  var addRandomNumber = (Math.random() * 0.1) / 2;
  var addTimeRandomNumber = Math.random() * 200;

  if (feedphoto) {
    addRotationAnimation(cube, addRandomNumber, addTimeRandomNumber);

  }

  calculateNewFeedSize()

  return cube;
}

function addPhotoClickEvent(cube) {
  cube.cursor = "pointer";
  cube.on("click", (ev) => {
    console.log(ev);
    handlePhotoMouseDown(ev);
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

function addBadge(username, color, object, uid) {
  var mesh = circleBadge(username, 150, 150, 75, Math.PI / 2, 0.45, color);

  object.add(mesh);

  mesh.cursor = "pointer";
  mesh.on("click", (ev) => {
    console.log(ev);
    handleFollow(uid);
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

function drawGlobe(ctx, x) {

  var globe = new Image()
  globe.onload = function() {
    ctx.drawImage(globe,x/4,x/4,x/2,x/2)
  }
  globe.src = globeimage

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
  color
) {
  var textcanvas = document.createElement("canvas");
  var ctx = textcanvas.getContext("2d");

  textcanvas.width = x;
  textcanvas.height = y;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x / 2, y / 2, radius * 2, 0, Math.PI * 2, true); // Outer circle
  //ctx.fillRect(0, 0, ctx.width, ctx.height);

  drawGlobe(ctx, x)

  ctx.fill();

  ctx.fillStyle = "#00000f";
  ctx.font = "italic 30px Times New Roman";

  ctx.fillTextCircle(text + " ", x, y, (radius / 3) * 1.8, -Math.PI / 2);

  ctx.stroke();

  var texture = new THREE.Texture(textcanvas); // now make texture
  texture.minFilter = THREE.LinearFilter; // eliminate console message
  texture.needsUpdate = true;

  //var geometry = new THREE.CylinderGeometry(threejsdimension, threejsdimension, 0.05, 20);
  var geometry = new THREE.CircleGeometry(threejsdimension / 2, 20);
  var material1 = new THREE.MeshStandardMaterial({
    color: 0xfe5b30,
    opacity: 1.0,
  });
  var material2 = new THREE.MeshStandardMaterial({
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
      1000
    );

    var renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2 || 1));
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

    const interaction = new Interaction(renderer, scene, camera);

    requestLatestPhotos();

    var loader = new GLTFLoader();

    loader.load(scenedata, function (gltf) {
      console.log("loaded scene");

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

      // var normalMap = textureLoader.load(holographicmap)
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

      console.log(daisy);

      // daisy.children[0].material = new THREE.MeshStandardMaterial({
      //   color: new THREE.Color("0x" + primarywhite)
      // })
    });

    var spotLight = new THREE.SpotLight(0xfff1db);
    spotLight.intensity = 1;

    spotLight.castShadow = true;

    const shadowmapmultiplier = 3;

    spotLight.shadow.mapSize.width = 1024 * 2;
    spotLight.shadow.mapSize.height = 1024 * 2;

    const d = 10;

    spotLight.shadow.camera.left = -d;
    spotLight.shadow.camera.right = d;
    spotLight.shadow.camera.top = d;
    spotLight.shadow.camera.bottom = -d;
    spotLight.shadow.radius = 10;

    spotLight.target.position.set(0, 0, 0);
    //spotLight.shadow.bias = -0.0005
    camera.add(spotLight);
    spotLight.position.set(0, 5, 10);

    camera.add(spotLight.target);

    var light2 = new THREE.DirectionalLight(0xfff1db); // soft white light
    light2.intensity = 0.25;
    //light2.shadow.bias = -0.0005

    camera.add(light2);
    light2.position.set(0, -9.5, 10);
    //camera.add(light2);

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
          generateFeed(paginateArray(currentPhotosList,20,currentPage))
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
      rotationmodifier = Math.abs(checkScrollSpeed());
      //console.log (checkScrollSpeed())
    }

    var globalResizeTimer = null;

    $(window).resize(function () {
      if (globalResizeTimer != null) window.clearTimeout(globalResizeTimer);
      globalResizeTimer = window.setTimeout(function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 200);
    });

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

function addToBackDict(photosList, stickers,div,title) {
  div.classList.add('sentBack')
  var newBackDict = {
    'div': div,
    'photosList' : photosList,
    'stickers' : stickers,
    'title' : title
  }
  backDicts.push(newBackDict)
}

class AccountForm extends Component {

  constructor() {
    super();
    this.state = {
      formDisplay: false,
      strokeCount: 0
    };
    this.dismissForm = this.dismissForm.bind(this)
    this.stickerForm = React.createRef()
    this.accountForm = React.createRef()
    this.signOut = this.signOut.bind(this)
    this.addStroke = this.addStroke.bind(this)
    this.clearStroke = this.clearStroke.bind(this)
    this.requestUserPhotos = this.requestUserPhotos.bind(this)
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
    this.clearStroke()
  }

  showForm() {
    this.setState({
      formDisplay:true
    })
  }

  signOut() {
    signOut()
    this.setState({
      formDisplay:false
    })

  }

  requestUserPhotos() {
    addToBackDict(currentPhotosList, stickers, this.accountForm.current,this.props.currentTitle)
    requestUserPhotos(firebase.auth().currentUser.uid)
    this.props.setCurrentTitle(firebase.auth().currentUser.displayName)
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
      <span><div className="usertext">{this.props.loggedInUser['username']||''}</div></span>
    </h1>
   </div>
</div>
</div>
       <div className="accountreadout">
         <div className="toolbarcontainer">
      <button id="title" onClick={this.requestUserPhotos}>&#x25B7; View Photos</button>

       <button id="title" onClick={this.signOut}>&#9789; Sign Out</button>
       
       </div>
    <ShortUserList setCurrentTitle={this.props.setCurrentTitle} accountForm={this.accountForm.current} currentTitle={this.props.currentTitle}></ShortUserList>
    </div>
    <div className="accountreadouttriangle"></div>
    <div className="dismiss" onClick={this.dismissForm}></div>
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
      <div className={"signatureform " + (this.props.formDisplay
      ? "canvasopen"
      : "")} >
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
              component.handleUpload();
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
          component.handleUpload();
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
                src="/images/8-Point-Star_black_void.svg"
                object-fit="scale-down"
              ></img>
            </span>
          </span>
        </div>
        <div
          className="loginform"
          style={{
            maxHeight: this.props.isAnonymous ? "800px" : "0px",
            overflow: this.props.isAnonymous ? "visible" : "hidden",
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
        <div
          className={
            "backgroundlogin " +
            (this.props.isAnonymous ? "" : "backgroundloginfadein")
          }
        ></div>

        {/* <div className="rodal-mask"></div> */}
      </div>
    );
  }
}

class ShortUser extends Component {
  constructor(props) {
    super();
    this.state = {
      displayName: "",
      following: true
    };
  }

  componentDidMount() {

    var component = this;

    console.log("short user " + this.props.uid)

    firebase
    .database()
    .ref("users/" + this.props.uid)
    .on('value', function (snapshot) {
      console.log(snapshot.val().username)
      component.setState({
        displayName:snapshot.val().username,
      })
    })
  }

  requestUserPhotos() {
    addToBackDict(currentPhotosList, stickers, this.props.accountForm,this.props.currentTitle)
    requestUserPhotos(this.props.uid)
    this.props.setCurrentTitle(this.state.displayName)
  }

  render() {
    return (
      <div className="shortuser" id={this.props.uid}>
        <div className="shortusertext">{this.state.displayName}</div>
        <div className="shortuserbuttoncontainer">
        <button className="shortuserbutton plus">+</button>
        <button className="shortuserbutton" onClick={this.requestUserPhotos.bind(this)}>&#x25B7;</button>
        </div>
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
      .on('value', function (snapshot) {

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
    <ShortUser setCurrentTitle={this.props.setCurrentTitle} accountForm={this.props.accountForm} currentTitle={this.props.currentTitle} uid={d} key={d}></ShortUser>);

    return (
      <div className="shortuserlist">
      
      <div onClick={() => this.toggleMenu()} className="listtitle"><div></div>FOLLOWING <div className={"arrow " +
                  (this.state.menuOpen
                    ? "arrowrotate"
                    : "")}>&#x25BE;</div></div>
      <div  className={"list " +
                (this.state.menuOpen
                  ? "listexpanded"
                  : "")}>
        {shortUsers}
      </div>
      <div className="divider"></div>
      </div>
    );
  }
}

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
      currentTitle: {}
    };

    this.accountForm = React.createRef()
    this.goBack = this.goBack.bind(this)
    this.submitInput = React.createRef()
    this.replyInput = React.createRef()
  }

  componentDidMount() {
    var component = this;

    firebase.auth().onAuthStateChanged(function (user) {
      if (user) {
        console.log("AUTH STATE CHANGED");
        console.log(user);
        var isAnonymous = user.isAnonymous;
        var uid = user.uid;
        var displayname = user.displayName;

        console.log(JSON.stringify(firebase.auth().currentUser))
        component.setState(
          {
            isAnonymous: isAnonymous,
            currentUser: JSON.stringify(firebase.auth().currentUser)
          },
          function () {}
        );

        //Get more info to add to the account form

        if (!user.isAnonymous) {

          firebase
          .database()
          .ref("users/" + uid)
          .on('value', function (snapshot) {
            console.log("firebase user ref")
            console.log(snapshot.val())
            component.setState({
              loggedInUser:snapshot.val()
            })
          })
        }

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
      }
      // ...
    });
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
    requestPrivateFeed()
  }

  requestPublicFeed() {
    requestLatestPhotos()
  }

  signOut() {
    signOut()
  }

  showAccountForm() {
    this.accountForm.current.showForm()
    // this.accountForm.current.accountForm.current.classList.remove('sentBack')
  }

  goBack() {
    var backDict = backDicts.pop()
    if (backDict != undefined) {
      clearFeed()
      setUpNewFeed(backDict.photosList,backDict.stickers)
      this.setState({
        'title':backDict.title
      })
      backDict.div.classList.remove('sentBack')
    }
  }

  setCurrentTitle(title) {
    this.setState({
      'title':title
    })
  }

  submitInputOnChange(event) {
    submitOnChange(this.submitInput.current, event)
    console.log("Submit input")
  }

  replyInputOnChange(event) {
    replyOnChange(this.replyInput.current, event)
  }

  render() {
    return (
      <div>
            <div class="title" >
    <div class="titletext" >SUNSHINE</div>
    <div id="progress" className="progress">
    <div className="backTitle " style={this.state.title ? {'opacity':'1', 'transform':'translateX(-20px)'} : {'opacity':'0', 'transform':'translateX(20px)'}}><div onClick={this.goBack.bind(this)} className="backButton" style={this.state.title ? {'display':'inline-block'} : {'display' :'none'}}>&#x27F5;&#xFE0E;</div>{this.state.title ? this.state.title : ""}</div>
    </div>
    <AccountForm setCurrentTitle={this.setCurrentTitle.bind(this)} ref={this.accountForm} loggedInUser={this.state.loggedInUser} currentUser={this.state.currentUser} />

    </div>
    <div className="modeBar">
    <button className="modebutton globe" id="requestpublic" onClick={this.requestPublicFeed.bind(this)}><img src="/images/Globe-5.svg"/></button>
    <button className="modebutton private" onClick={this.requestPrivateFeed.bind(this)}>Private</button>
    <button className="modebutton account" onClick={this.showAccountForm.bind(this)}>account</button>

    <div className="shinebutton" id="shinebutton">
      <input onChange={this.submitInputOnChange.bind(this)} ref={this.submitInput} type="file" accept="image/*" id="file-input"/>
      <label for="file-input"><img
        src="/images/8-Point-Star_black_void.svg"
      /></label>
    </div>
    <div className="replyinput">
      <input onChange={this.replyInputOnChange.bind(this)} ref={this.replyInput} type="file" accept="image/*" id="reply-input"/>
      <label for="reply-input"></label>
    </div>

    </div>
      <div id="root">
        <div className="threejs">
          <ThreeJS />
        </div>
        <LoginForm
          closeloginform={this.loginFormHide.bind(this)}
          register={this.register.bind(this)}
          signIn={this.signIn.bind(this)}
          isAnonymous={this.state.isAnonymous}
        />
      </div>
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
  const c = document.documentElement.scrollTop || document.body.scrollTop;
  if (c > 0) {
    window.requestAnimationFrame(scrollToTop);
    window.scrollTo(0, c - c / 8);
  }
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