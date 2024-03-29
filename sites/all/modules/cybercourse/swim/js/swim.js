(function ($) {
  
  Drupal.behaviors.swim = {
    done: false,
    attach: function() {
//console.log('attach');//return;
      if ( this.done ) {
        return;
      }
      this.done = true;
//      CKEDITOR.on("instanceCreated", function(evnt) {
//        f=4;
//      });
      //Setup code to run after CKEDITOR instances have been created.
      CKEDITOR.on("instanceReady", function(evnt) {
//console.log('armeshlew');//return;
        var editor = evnt.editor;
        //When editor gains/loses focus, trigger underlying textarea events.
        //Needed for insert module to work.
//console.log('spider');//return;
        editor.on('focus',function(evnt) {
          $(editor.element.$).trigger('focus');
        });
        editor.on('blur',function(evnt) {
          $(editor.element.$).trigger('blur');
        });
//console.log('turtles all the way down');//return;
        editor.document.appendStyleSheet( Drupal.settings.swim.editing_stylesheet );
        //Size the editor.
        var heightFrac = 0.70; //Default.
        if ( Drupal.settings.swim.heightFraction ) {
          heightFrac = Drupal.settings.swim.heightFraction;
        }
        if ( editor.name.search('summary') != -1 ) {
          heightFrac = 0.20;
        }
        editor.resize('100%', window.innerHeight * heightFrac);
//console.log('and kittens');//return;
        Drupal.behaviors.swim.swimSetup(editor);
        //Add a class for customization of the body.
//console.log('snaaakes');//return;
        editor.document.getBody().addClass('swim_body')
//        $(editor.document.$.body).addClass("swim_body");
        
        //Flag the editor as initialized.
        $( "#" + editor.id ).attr("data-swim-init", "yes");
//console.log('ostriches');return;
      });
//console.log('dog');//return;
      //Check that the config exists.
      if ( ! Drupal.swimCkConfig ) {
        console.log("Missing config");
        return;
      }
//console.log('cat');//return;
      //Add plugins.
//      CKEDITOR.plugins.addExternal( 'rest_help', 
//      '/sites/all/modules/cybercourse/swim/ck_plugins/rest_help/' );
      if ( Drupal.settings.swim.extraPlugins.name ) {
        $.each( Drupal.settings.swim.extraPlugins.name, function(index, pluginName) {
          CKEDITOR.plugins.addExternal( 
            pluginName, 
            Drupal.settings.swim.extraPlugins.path[index] 
          ); //End addExternal.
        } ); //End each.
      } //End if there are extraPlugins.
      //Replace the textareas with CKEditors.
      //This will trigger instanceReady above.
//console.log('llama');//return;
      var textAreas = $("textarea.swim-editor");
      $(textAreas).each(function(index, element) {
//console.log('zebra');//return;
        //Make sure element has not already been initialized.
        if ( ! $(element).attr("data-swim-init") ) {
          CKEDITOR.replace(element.id, Drupal.swimCkConfig);
        }
      });
//console.log('cow');return;
    }, //End attach.
    swimSetup: function (editor) {    
      this.setupBeforeUnload(editor);
      if ( editor.commands.peek ) {
        this.swimPeekSetup(editor);
      }
    },
    swimPeekSetup: function(editor) {  
      //Disable peek button until ready.
      editor.commands.peek.disable();
      //Compute the URL for the iframe that simulates the device.
      var iframeSrc = Drupal.settings.swim.base_url + "/swim-mt-peek";      
      //Make peek toolbar.
      var iconPath = Drupal.settings.swim.peekIconsPath;
      //Define the toolbar for this instance. Include an id.
      var toolbarHtml
      = "<div id='" + editor.id + "-toolbar' class='swim-peek-toolbar cke_top'>"
      +   "<span class='cke_toolgroup' role='presentation'>"
      +     "<a id='" + editor.id + "-swim-peek-as-desktop' "
      +        "class='swim-peek-as-desktop cke_button cke_button_off swim-button'><img "
      +        "src='" + iconPath + "desktop.png' title='Laptop'>"
      +     "</a>"
      +     "<a id='" + editor.id + "-swim-peek-as-tablet' "
      +        "class='swim-peek-as-tablet cke_button cke_button_off swim-button'><img "
      +        "src='" + iconPath + "tablet.png' title='Tablet'>"
      +     "</a>"
      +     "<a id='" + editor.id + "-swim-peek-as-phone' "
      +        "class='swim-peek-as-phone cke_button cke_button_off swim-button'><img "
      +        "src='" + iconPath + "phone.png' title='Phone'>"
      +     "</a>"
      +   "</span>"
//      +   "<span class='cke_toolgroup' role='presentation'>"
//      +     "<a id='" + editor.id + "-refresh' "
//      +        "class='swim-peek-refresh cke_button cke_button_off swim-button'><img "
//      +        "src='" + iconPath + "refresh.png' title='Refresh'>"
//      +     "</a>"
//      +   "</span>"
      + "</div>";
      var peekHtml = 
        "<div id='" + editor.id + "-swim-peek-outer' class='swim-peek-outer'>" //Everything in the dialog.
      +   toolbarHtml
      +   "<div class='swim-peek-inner'>"
            //The device.
      +     "<iframe id='" + editor.id + "-swim-peek-device' class='swim-peek-device'></iframe>"
      +   "</div>" //End inner.
      + "</div>"; //End outer.
      $("body").append( peekHtml );
      //Hide what was just added.
      $("#" + editor.id + "-swim-peek-outer").hide();
      $("#" + editor.id + "-swim-peek-device").attr("src", iframeSrc);
      this.loadedAlready = false;
      var thisythis = this; //For closure.
      $("#" + editor.id + "-swim-peek-device").load(function() {
        //Do this only once. Sometimes there is more than one load event?
        if ( ! thisythis.loadedAlready ) {
          thisythis.continueInit(editor);
        }
      });
    }, //End attach.
    continueInit: function(editor) {
      //Make a clone of the HTML to use as a template.
      //KRM - Do this once for all editors on the page?
      //      They should have the same template HTML. 
      this.templateBodyHtml 
        = $("#" + editor.id + "-swim-peek-device").contents()
          .children("html").children("body").clone();
      //Prep the dialog.
      $( "#" + editor.id + "-swim-peek-outer" )
        .dialog({
          title: 'Peek',
          autoOpen : false,
          dialogClass : "dialog-to-top" //Dialog on top of top nav bar.
        });
      //Set up events on the peek buttons.
      //Now the peek processing code.
      //KRM - do this once for all editors on the page?
      var swimBehavior = this; //Convenience for closures.
      $( "#" + editor.id + "-swim-peek-as-desktop").click( function() {
        swimBehavior.deviceButtonClicked(editor, "desktop");
      } );
      $("#" + editor.id + "-swim-peek-as-tablet").click( function() {
        swimBehavior.deviceButtonClicked(editor, "tablet");
      } );
      $("#" + editor.id + "-swim-peek-as-phone").click( function() {
        swimBehavior.deviceButtonClicked(editor, "phone");
      } );
      //Set up the refresh button.
      $("#" + editor.id + "-peek-refresh").click( function() {
        swimBehavior.showPeek(editor);
      } );
      //Init toolbar display.
      editor.selectedPeek = "desktop";
      this.showSelectedButton( editor );
      //Enable the peek function now that it is setup.
      editor.commands.peek.enable();
      //Add styles for editing with CK.
//      editor.document.appendStyleSheet(Drupal.settings.swim.editing_stylesheet);
    }, //End continueInit.
    /**
    * Watch the plugin's peek button.
    */
    peekButtonClicked : function ( editor ) {
        //Add an obscuring thing.
        var obscurer = Drupal.settings.swim.obscurer;
        $("#" + editor.id + "-swim-peek-device").contents().find("body").first()
                .html( obscurer );
        if ( ! $( "#" + editor.id + "-swim-peek-outer" ).dialog( "isOpen" ) ) {
          $( "#" + editor.id + "-swim-peek-outer" ).dialog( "open" );
        }
        //Show the current peek.
        Drupal.behaviors.swim.showPeek( editor );
    },
    deviceButtonClicked : function( editor, buttonClicked ) {
      editor.selectedPeek = buttonClicked; //Right? Should be string? See next fn.
      this.showPeek( editor );
      this.showSelectedButton( editor );
    },
    /**
     * Adjust toolbar to show whichever button is pressed.
     */
    showSelectedButton : function( editor ) {
      $("#" + editor.id + "-swim-peek-as-desktop").removeClass("cke_button_on").addClass("cke_button_off");
      $("#" + editor.id + "-swim-peek-as-tablet").removeClass("cke_button_on").addClass("cke_button_off");
      $("#" + editor.id + "-swim-peek-as-phone").removeClass("cke_button_on").addClass("cke_button_off");
      $( "#" + editor.id + "-swim-peek-as-" + editor.selectedPeek )
          .removeClass("cke_button_off").addClass("cke_button_on");
    },
    /**
     * Grab rendered text from the server and show it.
     */
    showPeek : function( editor ) {
      //Position edges of device below toolbar.
      var toolbarHeight = $("#" + editor.id + "-toolbar").outerHeight();
      $("#" + editor.id + "-swim-peek-device").css("top", toolbarHeight );
      //Set up the peek to mimic the device.
      $( "#" + editor.id + "-swim-peek-device" ).css("width", "").css("height", "");
      $( "#" + editor.id + "-swim-peek-device" )
        .removeClass("swim-peek-device-desktop "
            + "swim-peek-device-tablet "
            + "swim-peek-device-phone")
        .addClass("swim-peek-device-" + editor.selectedPeek);
      var toolbarHeight = $("#" + editor.id + "-toolbar").outerHeight();
      var dialogTitleHeight = $(".ui-dialog-titlebar:first").outerHeight(); 
      //KRM - is this right? Probably - height the same for all editors.
      if ( editor.selectedPeek == 'desktop') {
        //Base size of dialog on what sizing the user has done. 
        var h = $(window).height() * 0.75;
        var w = $(window).width() * 0.75;
        $( "#" + editor.id + "-swim-peek-device" ).css("height", h).css("width", w);
        $( "#" + editor.id + "-swim-peek-outer" )
            .dialog( "option", "width", w + 40 )
            .dialog( "option", "height", 
              h + toolbarHeight + dialogTitleHeight + 40 
            )
            .dialog( "option", "title", "Peek (Desktop/laptop)");
      }
      else if (    editor.selectedPeek == 'phone' 
                || editor.selectedPeek == 'tablet' ) {
        //Base size of dialog on device size. 
        $( "#" + editor.id + "-swim-peek-outer" )
            .dialog( "option", "width", 
              $("#" + editor.id + "-swim-peek-device").outerWidth() + 20
            )
            .dialog( "option", "height", 
                $("#" + editor.id + "-swim-peek-device").outerHeight() 
              + toolbarHeight + dialogTitleHeight + 40
            )
            .dialog( "option", "title", 
                (editor.selectedPeek == 'phone')
                ? "Peek (iPhone 1 to 4S, landscape)"
                : "Peek (iPad 1 and 2, portrait)"
        );
      }
      else {
        throw "showpeek: bad selectedpeek: *" + editor.selectedPeek + "*";
      }
      //Get editor's current content.
      var markup = editor.getData();
      //Get rendering from server.
      var promise = $.ajax(
        Drupal.settings.basePath + 'swim-peek',
        {
          type: "POST",
          data: {
            'content': markup
          }
      });
      //Keep a ref to the editor this applies to.
      promise.editor = editor;
      var thisRef = this;
      promise.done( function (data) {
        thisRef.peekDataReturned(data, promise.editor);
      });
      promise.fail( this.peekFailed );
      promise.always( this.peekFinished );
//      this.showThrobber(, "Loading");
    }, // end showpeek.
    peekDataReturned : function( data, editor ) {
      if ( data.status == 'success' ) {
        
//        data.result += "<script>jQuery(document).ready(function(){jQuery(this).find('body').html('Squee');});</script>";
        
        //Restore body template content.
        //Get the template code.
        var templateCode = this.templateBodyHtml.clone();
        //Erase contents of the MT container, if any.
        templateCode = $(templateCode).find("#swim-mt-content-container").first().html('');
        //Insert the MT template code into the preview iframe.
        $("#" + editor.id + "-swim-peek-device").contents().find("body").first()
            .html( templateCode );
        //Insert new content.
        $("#" + editor.id + "-swim-peek-device").contents().find("body").find("#swim-mt-content-container")
            .append(data.result);
      }
      else {
        throw "showPeek: Ajax preview call failed.";
      } // end data.status not success.      
    },
    peekFailed : function( textStatus ) {
      throw new Exception( "Ajax preview request failed: " + textStatus );
    },
    peekFinished: function() {
      
    },
    showThrobber : function( afterThisElement, message ) {
      if ( ! message ) {
        message = "";
      }
      var element = $('<div class="ajax-progress ajax-progress-throbber"><div class="throbber">&nbsp;' + message + '</div></div>');
      $(afterThisElement).after(element);      
    },
    removeThrobber : function( afterThisElement ) {
      var element = $(afterThisElement).siblings(".ajax-progress-throbber");
      if ( element ) {
        element.remove();
      }
    },
    setupBeforeUnload : function(editor) {
      //Store starting values of content fields.
      this.initialBody =  editor.document.getBody().getText();
      //Convenience var for closures.
      var swimRef = this;
      //Flag showing whether unload code should check for changes.
      this.checkForChanges = true;
      //When click Save, Save and Edit, etc., no need to check for changes. 
      //Drupal will handle it.
      $("#edit-submit, #edit-save-edit, #edit-preview-changes, #edit-delete")
          .click(function(){
            swimRef.checkForChanges = false;
          });
      window.onbeforeunload = function() {
        if ( swimRef.checkForChanges ) {
          if ( editor.document.getBody().getText() != swimRef.initialBody ) {
            return "There are unsaved changes. Are you sure you want to leave?";
          }
        }
      }
    }
  };
  //Selector that will find content in the document fetched to act as a template.
//  Drupal.behaviors.swim.contentContainerClass = "document";
}(jQuery));
