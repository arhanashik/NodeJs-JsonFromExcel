    var express = require('express'); 
    var app = express(); 
    var bodyParser = require('body-parser');
    var multer = require('multer');
	
	var xlstojson = require("xls-to-json-lc");
	var xlsxtojson = require("xlsx-to-json-lc");
	
	//for deleting file
	var fs = require('fs');
	
    app.use(bodyParser.json());
	
    var storage = multer.diskStorage({ //multers disk storage settings
        destination: function (req, file, cb) {
            cb(null, './uploads/')
        },
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
        }
    });
	
    var upload = multer({ //multer settings
                    storage: storage,
                    fileFilter : function(req, file, callback) { //file filter
                        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1)
						{
                            callback('Wrong extension type', false);
							return;
                        }
						
                        callback(null, true);
                    }
                }).single('file');
	/*var upload = multer({ //multer settings
                    storage: storage
                }).single('file');*/
				
    /** API path that will upload the files */
    app.post('/upload', function(req, res) {
        var exceltojson;
        upload(req, res, function(err){
            if(err){
                 res.json({error_code:1, err_desc:err});
                 return;
            }
			
            /** Multer gives us file info in req.file object */
            if(!req.file){
                res.json({error_code:1, err_desc:"No file passed"});
                return;
            }
			
            /** Check the extension of the incoming file and 
             *  use the appropriate module
             */
            if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
                exceltojson = xlsxtojson;
            } else {
                exceltojson = xlstojson;
            }
			
            try {
                exceltojson({
                    input: req.file.path,
                    output: null, //since we don't need output.json
					sheet: "Answer",
                    lowerCaseHeaders:false
                }, function(err, result){
                    if(err) {
                        return res.json({error_code:1, err_desc:err, data: null});
                    }
					
                    res.json({error_code:0, err_desc:null, data: result});
                });
            } catch (e){
                res.json({error_code:1, err_desc:"Corupted excel file"});
            }
			
			try {
				fs.unlinkSync(req.file.path);
				console.log('uploaded file deleted after converted to json');
			} catch(e) {
				console.log(e);
			}
		})
    }); 
	
    app.get('/',function(req, res){
		res.sendFile(__dirname + "/index.html");
    });
	
    app.listen('3030', function(){
        console.log('server is running on http://localhost:3030');
    });