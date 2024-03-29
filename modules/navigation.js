import { TRANSITION_END } from '../utils';
import '../plugins/bem';

/* global gtag */

/*
* Navigation
*/
export default function (options) {

  /*
  *	Properties
  */
  var obj = this;
  this.currentURL = undefined;
  this.isLoading = false;
  this.isPopping = false;

  if (options == undefined) {
    options = {};
  }

  /*
  * Options
  */
  this.options = $.extend({
    init: true,
    useTransition: true,
    useEvents: true,
    selectors: {
      pageTransition: '.page-transition',
      pageContent: '.app',
      pageTarget: '.app',
    },
  }, options);

  /*
  * Elements
  */
  this.el = {
    pageTransition: (this.options.useTransition) ? $(this.options.selectors.pageTransition).BlockElement() : undefined,
    pageTarget: $(this.options.selectors.pageTarget),
  };

  /*
  *	Page display
  */
  this.pageDisplay = function(targetURL, loadedContent) {
    // Display loaded page
    let response = $('<html>').html(loadedContent);
    obj.el.pageTarget.replaceWith($(obj.options.selectors.pageContent, response));
    obj.el.pageTarget = $(obj.options.selectors.pageTarget);
    setTimeout(function() {
      if (targetURL == obj.currentURL) {
        obj.isLoading = false;
        obj.registerLinks();
        if (obj.options.useEvents) {
          $(window).trigger('page_load');
        }
      }
    }, 50);

    // Remove transition
    if (obj.options.useTransition) {
      setTimeout(function() {
        obj.el.pageTransition.addModifier("hidden").on(TRANSITION_END, function() {
          obj.el.pageTransition.off(TRANSITION_END).removeModifier("visible").removeModifier("hidden");
        });
      }, 	150);
    }

    // Push state
    if (!obj.isPopping) {
      document.title = $("title", response).text();
      var data = {
        isPageTransition: true,
        previousPageURL: window.location.href,
      };
      window.history.pushState(data, $("title", response).text(), obj.currentURL);
    }

    // Analytics called if available
    if ("gtag" in window) {
      if ("gtagid" in window) {
        gtag('config', window.gtagid, {
          'page_location': obj.currentURL,
        });
      } else {
        console.log("Erreur: définir le ID gtag pour mlmi-elements");
      }
    }
    obj.isPopping = false;
  };

  /*
  *	Page transition
  */
  this.getPage = function(href, callback)
  {
    // Keep current URL
    obj.currentURL = href;

    // Default callback
    if (callback == undefined) {
      callback = obj.pageDisplay;
      obj.isUsingCustomCallback = true;
    } else {
      obj.isUsingCustomCallback = false;
    }

    // Setting variables
    var targetURL = href,
    loadedContent = undefined,
    pageHasDisappeared = false,
    contentHasLoaded = false;

    // Show page transition
    obj.isLoading = true;
    if (obj.options.useTransition) {
      obj.el.pageTransition.addModifier("visible").on(TRANSITION_END, function() {
        $(this).off(TRANSITION_END);
        if (obj.options.useEvents) {
          $(window).trigger('page_exit');
        }
        pageHasDisappeared = true;
        if (contentHasLoaded) {
          callback(targetURL, loadedContent);
        }
      });
      $.get(targetURL, {}, function(x) {
        loadedContent = x;
        contentHasLoaded = true;
        if (pageHasDisappeared) {
          callback(targetURL, loadedContent);
        }
      }, 'html').fail(function(x) {
        if (x.status == 404) {
          loadedContent = x.responseText;
          contentHasLoaded = true;
          if (pageHasDisappeared) {
            callback(targetURL, loadedContent);
          }
        }
      });
    } else {
      if (obj.options.useEvents) {
        $(window).trigger('page_exit');
      }
      $.get(targetURL, {}, function(x) {
        loadedContent = x;
        callback(targetURL, loadedContent);
      }, 'html').fail(function(x) {
        if (x.status == 404) {
          loadedContent = x.responseText;
          callback(targetURL, loadedContent);
        }
      });
    }
  };

  /*
  * Register links
  */
  this.registerLinks = function()
  {
    $("a[target!='_blank']").each(function(){
      if (!$(this).data("registeredTransitionLink")){
        $(this).data("registeredTransitionLink", 1);
        if ($(this).attr("href") && $(this).attr("href").substr(0,4) == "http" && $(this).attr("href").indexOf(window.location.hostname) === -1){
          $(this).attr("target", "_blank");
        }
        $(this).on("click", function(e){
          if ($(this).attr("target") === "_blank"){
            return true;
          }
          if ($(this).data("preventTransition") === 1) {
            return true;
          }
          if (e.originalEvent != undefined && (e.originalEvent.cmdKey || e.originalEvent.metaKey)){ return true; }
          var link = $(this).attr("href"),
          ext = link.substr(link.lastIndexOf('.') + 1);
          if (link.substr(0,7) === "mailto:"){ return true; }
          if (link.substr(0,4) === "tel:"){ return true; }
          if (link === "#") { return false; }
          if (["pdf", "jpg", "gif", "png", "doc", "docx", "xls", "xlsx", "ppt", "txt", "xml"].indexOf(ext) !== -1){ return true; }
          obj.getPage(link);
          return false;
        });
      }
    });
  };

  /*
  * Initializer
  */
  this.init = function()
  {
    /* Pop state (back) */
    $(window).on("popstate", function(e) {
      let popState = e.originalEvent.state;
      if (popState != null) {
        if (popState.isPageTransition != null && popState.isPageTransition == true) {
          obj.isPopping = true;
          obj.getPage(e.target.location.href);
        }
      }
    });

    /* Replace initial state (load) */
    window.history.replaceState({
      isPageTransition: true,
      previousPageURL: window.location.href,
    }, document.title, window.location.href);

    /* First page load */
    if (obj.options.useEvents) {
      $(window).trigger('page_load');
    }

    /* Register links */
    obj.registerLinks();
  };

  /* Initialize and/or return */
  if (obj.options.init === true) {
    obj.init();
  }
  return obj;
}
