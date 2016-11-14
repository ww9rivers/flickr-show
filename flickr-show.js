;var c9r =				// Private namespace
{
    img:	false,			//	Current image object
    dim:	0,			//	Next image dimension
    top:	"",			//	Top margin
    key:	false,			//	prefs.mykey
    total:	1,			//	Total number of photos
    page:	1,			//	Current page, start at 1
    pages:	0,			//	Total number of pages
    perpage:	10,			//	Number of items per page
    photo:	[],			//	Current photo set
    cp:		undefined,		//	Current photo object
    div:	false,			//	Container for the photos
    width:	0,			//	Width of the container
    height:	0,			//	Height of the container
    p:		{},			//	Userprefs
    pace:	0,			//	Userprefs.pace
    last:	0,			//	When the last photo was displayed
    paused:	false,			//	True if mouse pointer is in
    monitored:	false,			//	ID of setTimeout() for c9r.monitor()


    alert_stop: function (msg)
    {
	alert(c9r.p.getMsg(msg)+"<br><br>"+c9r.p.getMsg("stop"));
    },


    flickr_show: function ()
    {
	c9r.p = new gadgets.Prefs();
	if (!c9r.key) {
	    if (!(c9r.key = c9r.get_pref("mykey"))) {
		c9r.alert_stop("nokey");
		return;
	    }

	    c9r.div = $('#c9rFlickrShow');
	    c9r.div.parent().css('background-color', c9r.get_pref("mycolor"));
	    c9r.width = c9r.div.width();
	    c9r.height = c9r.div.height();
	    if ((c9r.pace = c9r.p.getInt("mypace")*1000) < 1000) {
		c9r.pace = 10000;
	    }
	    c9r.last = c9r.now() - c9r.pace;
	    c9r.monitor();
	}
	google.load("jqueryui", "1");
	c9r.div.css("cursor", "crosshair").hover(c9r.pointer_in, c9r.pointer_out);
    },


    flickr_json: function (uri, xf, params)
    {
	if (params == undefined) { params = {}; }
	params[gadgets.io.RequestParameters.CONTENT_TYPE] = gadgets.io.ContentType.JSON;
	gadgets.io.makeRequest("http://api.flickr.com/services/rest/?format=json&nojsoncallback=1&"
			       +uri, xf, params);
    },


    get_next_page: function ()
    {
	if (c9r.photo.length > 0) { return false; }

	if (++c9r.page >= c9r.pages) { c9r.page = 1; }
	c9r.get_photo_page();
	return true;
    },


    //	Find the given page of photos from Flickr.
    get_photo_page: function ()
    {
	var uri = "method=flickr.photos.search&nojsoncallback=1&api_key=" + c9r.key
	    + "&tags=" + c9r.get_pref("mytags")
	    + "&tag_mode=all&privacy_filter=1&safe_search=1&per_page=" + c9r.perpage;
	var grp = c9r.get_pref("mygroup");

	if (grp) { uri += "&group_id=" + grp; }
	uri += "&page="+c9r.page;
	c9r.flickr_json(uri, c9r.get_photo_size);
    },


    get_photo_size: function (xobj)
    {
	$.extend(c9r, xobj.data.photos);
	if (c9r.total <= 0) {
	    c9r.alert_stop("noimg");
	} else if (c9r.cp == undefined) {
	    c9r.select_photo();
	}
    },


    get_pref: function (xarg)
    {
	return c9r.p.getString(xarg);
    },


    //	Determin the image to load based on gadget size, preload the image.
    load_photo: function (xobj)
    {
	var label = c9r.get_pref("mysize");
	var xo = xobj.data.sizes.size;
	var src;
	var xw = "";
	var xh;
	c9r.dim = "";
	for (var xi in xo) {	// Pick source in appropriate size
	    var xs = xo[xi];
	    src = xs.source;
	    if (label == "Auto") {
		xw = xs.width / c9r.width;
		xh = xs.height / c9r.height;
		if (xw < 1 && xh < 1) { continue; }
		if (xw > xh) {
		    c9r.dim = " width='"+Math.min(c9r.width, xs.width);
		    c9r.top = " margin-top:"+Math.floor((c9r.height-xs.height/xw)/2)+"px;";
		} else {
		    c9r.dim = " height='"+c9r.height;
		    c9r.top = "";
		}
		break;
	    } else if (xs.label == label) { break; }
	}

	c9r.img = new Image();
	c9r.img.onload = c9r.play_photo;
	c9r.img.src = src;
	if (c9r.dim == "") {
	    c9r.dim = " width='"+xs.width;
	    c9r.top = " margin-top:"+Math.floor((c9r.height-xs.height)/2)+"px;";
	}
    },


    monitor: function ()
    {
	c9r.monitored = window.setTimeout(c9r.monitor, c9r.pace);
	if (c9r.get_next_page() && c9r.cp == undefined) {
	    c9r.select_photo();
	}
    },


    now: function ()
    {
	return (new Date()).getTime();
    },


    //	Callback function for c9r.img.onLoad().
    play_photo: function ()
    {
	if (c9r.paused) { return; }

	var wait = c9r.pace - c9r.now() + c9r.last;
	if (wait < 0) { wait = 0; }
	c9r.div.delay(wait).fadeOut(400, function () {
	    var xp = c9r.cp;
	    c9r.cp = undefined;
	    if (xp != undefined) {
		c9r.div.html("<a href='http://www.flickr.com/photos/" + xp.owner + "/" + xp.id
			     + "/' target='_flickr' style='border:0px;'><img src='"+c9r.img.src
			     + "'" + c9r.dim + "px' style='border:0px;"+c9r.top+"' /></a>");
		c9r.div.fadeIn(400, c9r.select_photo);
		c9r.last = c9r.now();
	    }
	});
    },


    pointer_in: function (ev)
    {
	c9r.paused = true;
	if (typeof c9r.monitored == "number") {
	    window.clearTimeout(c9r.monitored);
	}
	$.clearQueue();
},


    pointer_out: function (ev)
    {
	c9r.paused = false;
	c9r.play_photo();
	c9r.monitor();
    },


    //	Once a page is found, load a random image and start a slide show.
    select_photo: function ()
    {
	phid = Math.floor(Math.random() * (c9r.photo.length - 1));
	var xp = c9r.photo[phid];
	if (xp == undefined) {
	    return;
	}

	c9r.cp = xp;
	c9r.flickr_json("method=flickr.photos.getSizes&api_key=" + c9r.key
			+ "&photo_id=" + xp.id,
			c9r.load_photo);

	// Go through the photos page by page if more
	if (c9r.pages > 1) {
	    c9r.photo.splice(phid, 1);
	    if (c9r.photo.length > 0) {	return; }

	    if (++c9r.page == c9r.pages) { c9r.page = 1; }
	    c9r.get_photo_page();
	}
    }
};
