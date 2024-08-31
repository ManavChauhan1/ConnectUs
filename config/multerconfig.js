const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

//Setting up Disk Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads')
    },
    filename: function (req, file, cb) {
      crypto.randomBytes(12, function(err, name){
        if (err) {
            return cb(err);
        }
        const fn = name.toString("hex") + path.extname(file.originalname);
        cb(null, fn);
      })
    }
  })
  
  
  //Creating Upload variable and export
const upload = multer({ storage: storage })

module.exports = upload;