var bloom = bloom || {};

var ABSOLUTE_PATH = (location.href.indexOf("bloomhealth") > -1) ? "/bloomhealth/" : "/"

function formatCurrency(num, hideCents) {
    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num))
        num = "0";
    var sign = (num == (num = Math.abs(num)));

    num = Math.floor(num * 100 + 0.50000000001);

    var cents = num % 100;

    num = Math.floor(num / 100).toString();

    if (cents < 10)
        cents = "0" + cents;
    for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++)
        num = num.substring(0, num.length - (4 * i + 3)) + ',' + num.substring(num.length - (4 * i + 3));
    var centsDisplay = (hideCents) ? '' : '<span class="cents">.' + cents + '<span class="screenreader"> cents</span></span>';

    return (((sign) ? '' : '-') + '$' + num + centsDisplay);
}

function unFormatCurrency(num) {
    num = num.toString().replace(/\$|\,/g, '');
    if (isNaN(num))
        num = "0";
    return parseFloat(num);
}
function add_comma(n) {
    var str = n.toString()

    var dollars = str.split('.')[0];
    var cents = str.split('.')[1];

    if (!cents) cents = '00';

    if (dollars.length == 4) {
        dollars = dollars.charAt(0) + ',' + dollars.substr(1, 3)
    } else if (dollars.length == 5) {
        dollars = dollars.substring(0, 2) + ',' + dollars.substring(2, 5)
    }

    return (dollars + '<span class="cents">.' + cents + '<span class="screenreader"> cents</span></span>')
}
// initialize bloom plugin namespace
if (!$.bh) {
    $.bh = {}; // Create the bloom plugin namespace if it is not already
}

$.bh.lastFocussedElement = null;

// takes a js date object and converts it to yyyy-mm-dd
$.bh.formatLocalDate = function(dateObj) {
    return $.datepicker.formatDate('yy-mm-dd', dateObj);
}
// takes a local date string (yyyy-mm-dd) and converts it to a js date object
$.bh.parseLocalDateFromString = function(dateStr) {
    return $.datepicker.parseDate('yy-mm-dd', dateStr);
    //    return new Date()
}
$.bh.parseLocalDate = function(month, day, year) {
    return $.bh.parseLocalDateFromString(year + "-" + month + "-" + day);
}
// takes a js date object and converts it to a mm/dd/yyyy
$.bh.formatDisplayDate = function(dateObj) {
    return $.datepicker.formatDate('mm/dd/yy', dateObj);
}
// takes a local date string (yyyy-mm-dd) and converts it to a js date object
$.bh.parseDisplayDate = function(dateStr) {
    return $.datepicker.parseDate('mm/dd/yy', dateStr);
}
// gets the age as of today from a date
$.bh.getAge = function(month, day, year, currentMonth, currentDay, currentYear) {
    var mn = getNumber(month);
    var dy = getNumber(day);
    var yr = getNumber(year);
    var today = $.bh.parseLocalDate(currentMonth, currentDay, currentYear)
    try {
        var dateFrom = $.bh.parseLocalDate(mn, dy, yr);
    } catch(e) { return 0;}
    var milli=today-dateFrom;
    var milliPerYear=1000*60*60*24*365.26;

    var yearsApart=milli/milliPerYear;
    return Math.floor(yearsApart);
};

$.bh.trackEvent = function (category, action, label, value) {
    var gaq;
    var kmq;
    if(typeof _gaq != "undefined") gaq = _gaq;
    if(typeof _kmq != "undefined") kmq = _kmq;

    if(gaq){
        gaq.push(['_trackEvent', category, action, label, value]);
    }
    if(kmq){
        if(label){
            kmq.push(['record', category, {'Action':action,'Label':label}]);
        } else {
            kmq.push(['record', action]);
        }
    }
};

// This is only used to register outbound link click tracking. Link must be present in DOM before calling this.
// If passing in an element as the first parameter, don't pass in a jQuery object!
// For more info, see: http://support.kissmetrics.com/apis/javascript/javascript-specific#tracking-outbound-link-clicks
$.bh.registerTrackOutboundLink = function (selectorOrElement, category, action) {
    if(typeof _kmq != "undefined") {
        var message = category + ' ' + action;
        _kmq.push(['trackClickOnOutboundLink', selectorOrElement, message]);
    }
};

function getNumber(num) {
    // explicitly specify radix (10); else, "09" returns 0
    return isNaN(parseInt(num, 10)) ? 0 : parseInt(num, 10);
}

if (jQuery.blockUI) {
    $.blockUI.defaults.css = {top:'0px'};
    $.blockUI.defaults.centerY = false;
}
$.bh.modal = function(el, options) {
    var obj = $(el);
    var defaults = {
        message: (obj) ? obj : el

    };

    var options = $.extend({}, defaults, options);

    $.blockUI(options);
}

function updateModalHeight() {
    $(window).triggerHandler('resize.nyroModal');
}
/* Global Functions */
$(function() {
    globalInitLiveEvents();
    globalInit();
});

// Live events that should just be bound once - not every time globalInit is called
function globalInitLiveEvents() {
    $('a, textarea, select, input').live('focus', function(event) {
        if ($('#nyroModalWrapper').size() == 0)
            $.bh.lastFocussedElement = $(this);
    });

    $(".metricsTrackingChangeEvent").live("change", function() {
        var $this = $(this);
        $.bh.trackEvent($this.data('metrics-tracking-category'), $this.data('metrics-tracking-action'), $this.data('metrics-tracking-label') + ": "+ $this.is(":checked"));
    });

    $('#changeWhosCovered').live('click', function() {
        $.bh.trackEvent('Survey','Change Whos Covered Clicked');
        return true;
    });

    /* **************************
     * Numbers Only
     * **************************/
    $('.numbers_only').live('keypress', function(e) {
        if (e.keyCode) code = e.keyCode;
        else if (e.which) code = e.which;
        else code = 0;

        var allowDecimal = !$(this).hasClass('no_decimal');
        var DECIMAL_CODE = 46;

        if ((code > 47 && code < 58) || code == 8 || (code == DECIMAL_CODE && allowDecimal) || code == 13) {

            // Auto tab for numbers_only & has maxlength
            if ($(this).attr('maxlength') != '') {
                var maxlength = parseInt($(this).attr('maxlength')) - 1;
                var val = $(this).val();

                if ($(this).hasClass('dob_month') || $(this).hasClass('dob_day') || $(this).hasClass('date_day') || $(this).hasClass('date_month')) {
                    if (val.length == maxlength && code != 8) {

                        // remove error
                        if ($(this).parent().hasClass('error')) {

                            $(this).parent().find('.error-msg').slideUp('fast').remove();
                            $(this).parent().removeClass('error');
                            $(this).find('.error-icon').remove();
                            $(this).unbind('focus')
                        }
                        var nextfield = $(this).parent().next().next().find('input.field');
                        setTimeout(function() {
                            nextfield.focus();
                        }, 100); // for chrome/IE
                    }
                }

            }
            return true;
        } else if (code == 9 || code == 37 || code == 39) {

        } else {
            return false;
        }
    });

    /* **************************
     * Numbers Only
     * **************************/
    $('.two_decimal_places_only').live('keyup', function(e) {
        var val = $(this).val();
        if ((val.indexOf('.') != -1) && val.substring(val.indexOf('.')+1).length > 2) {
            val = val.substring(0, val.indexOf('.')+3);
            $(this).val(val.toString());
        }

        return true;
    });

    /*
     * SSN Only
     */
    $('.ssn_only').live('keypress', function(e) {
        $(this).siblings('.error-icon').remove();
        var code = 0;
        if (e.keyCode) code = e.keyCode;
        else if (e.which) code = e.which;

        var BACKSPACE_CODE = 8;
        var HORIZONTAL_TAB_CODE = 9;
        var CARRIAGE_RETURN_CODE = 13;

        var BACK_ARROW_CODE = 37;
        var UP_ARROW_CODE = 38;
        var FORWARD_ARROW_CODE = 39;
        var DOWN_ARROW_CODE = 40;

        var DASH_CODE = 45;
        var ZERO_CODE = 48;
        var NINE_CODE = 57;

        if ( ((ZERO_CODE <= code) && (code <= NINE_CODE))
            || (code == DASH_CODE)
            || (code == BACKSPACE_CODE) || (code == CARRIAGE_RETURN_CODE) || (code == HORIZONTAL_TAB_CODE)
            || (code == BACK_ARROW_CODE) || (code == UP_ARROW_CODE) || (code == FORWARD_ARROW_CODE) || (code == DOWN_ARROW_CODE)
            ) {
            return true;
        } else {
            return false;
        }
    });

    $('textarea[maxlength]').live('keyup', function(){
        var max = parseInt($(this).attr('maxlength'));
        if($(this).val().length > max){
            $(this).val($(this).val().substr(0, $(this).attr('maxlength')));
        }

        $(this).parent().find('.charsRemaining').html('You have ' + (max - $(this).val().length) + ' characters remaining');
    });

    $('.field-wrap.error select.field').live('change', function() {
        $(this).parent().removeClass('error');
        $(this).find('.error-icon').remove();
        $(this).unbind('focus');
        $(this).parent().find('.error-msg').slideUp();
    });

    $('#print-page, .print-page').live('click', function() {
        window.print();
        return false;
    });

    $('.field-wrap.error .field').live('focus', function() {
        showFieldError($(this));
    });
}

bloom.pleaseWaitText = "Please wait...";
bloom.replaceLinkTextWithPleaseWait = function() {
    var link = $(this);
    link.addClass('clicked');
    link.is('a') ? link.html(bloom.pleaseWaitText) : link.val(bloom.pleaseWaitText);
}
/**
 * block ui on click and change display text on element
 */
bloom.blockUIClick = function() {
    bloom.replaceLinkTextWithPleaseWait.call(this);
    $.blockUI({ overlayCSS: { opacity: 0 }, message: "" });
    setTimeout(function() {
        $.blockUI({ overlayCSS: { opacity: 0.5 }, message: "" });
    }, 3000);
};
/**
 * @param {JQuery} dom The dom tree to apply the click listener to
 */
bloom.applyBlockUIClickListener = function(dom) {
    $('.blockui-onclick', dom).click(bloom.blockUIClick);
};
/**
 * prevent double clicks and change display text on element
 * @return {boolean} false if button was already clicked, else true
 */
bloom.clickIfNotClicked = function() {
    if ($(this).hasClass('clicked')) {
        return false;
    }
    bloom.replaceLinkTextWithPleaseWait.call(this);
    return true;
};
bloom.applyWaitOnClickListener = function(dom) {
    $('.wait-onclick', dom).click(bloom.clickIfNotClicked);
};

function globalInit(domElement) {

    var dom = domElement;
    if (!dom) {
       dom = $(document);
    }

    /* **************************
     *  Magic back button links
     * **************************/
    var linkAction = function() { history.back();return false; };
    if (window.opener != null) {
        $('#back_button', dom).text("Close");
        linkAction = function() { window.close();return false; }
    }
    $('#back_button', dom).click(linkAction);

    /* **************************
     *  Auto-generated tabindex
     * **************************/
    var tabIndex = $('body').data('tabindex') || 1;
    // if we're initializing a modal, make sure the first hidden anchor
    // gets focus so tabbing is smooth when there is a form on the page.
    if (domElement && domElement.is('#nyroModalFull')) {
        $('a:first', domElement).attr('tabindex', tabIndex);
        tabIndex++;
    }
    $('form:first', dom).each(function() {
        $(this).find('input,select,textarea,a').each(function() {
            var $this = $(this);
            if (!$this.is('a') || tabIndex > 1) { // don't add index to anchors until we've reached a form element
                $(this).attr('tabindex', tabIndex);
                tabIndex++;
            }
        });
    });
    $('body').data('tabindex', tabIndex);

    /* **************************
     *	Calendar
     * **************************/
    $('.date_picker', dom).datepicker({
        onSelect: function(dateText) {
            var d = dateText.split('/');
            var inputs = $(this).parents('.field-item').find('input[type=text]');

            $(inputs[0]).val(d[0]).prev('label').hide();
            $(inputs[1]).val(d[1]).prev('label').hide();
            $(inputs[2]).val(d[2]).prev('label').hide();
        },
        beforeShow: function(input) {
            var datepicker = $('#ui-datepicker-div', dom);
            datepicker.css('z-index', '100001');
            $('body', dom).append(datepicker);
        },
        minDate: "0",
        maxDate: "+60d",
        showOtherMonths: true,
        selectOtherMonths: true,
        showOn: 'button',
        buttonImage: ABSOLUTE_PATH+'images/calendar-icon.gif',
        buttonImageOnly: true

    });
    // hide datepicker on load
    $('#ui-datepicker-div', dom).hide();

    // we have 3 fields, so no need to focus
    $('img.ui-datepicker-trigger', dom).click(function() {
        $('#start_year', dom).blur()
    });

    /*
     * Integers Only
     */
    $('.integers_only', dom).keydown(function(event) {
        if (event.keyCode == 46 || event.keyCode == 8) {
        } else {
            if (event.keyCode < 95) {
                if (event.keyCode < 48 || event.keyCode > 57) {
                    event.preventDefault();
                }
            } else {
                if (event.keyCode < 96 || event.keyCode > 105) {
                    event.preventDefault();
                }
            }
        }
    });

    $('textarea[maxlength]', dom).after($('<div class="charsRemaining note"></div>'));

    /* **************************
     *	Error messaging
     * **************************/
    // Gracefully degrade labels for non-JS users
    $('.field-wrap label', dom).each(function() {
        if (!$(this).parents().hasClass('horizontal-labels')) {
            $(this).inFieldLabels({fadeOpacity:0.3}).css({'position':'absolute','top':'9px'});
        }
    })

    $('.field-wrap.error div.note', dom).hide().addClass('error-msg')

    // Error messaging, removing class
    $('.field-wrap.error', dom).children('input,textarea,select').keyup(function(e) {

        if (e.keyCode) code = e.keyCode;
        else if (e.which) code = e.which;
        else code = 0;

        if (code != 16 && code != 17 && code != 18 && code != 13 && code != 8 && code != 9) {

            if ($(this).hasClass('numbers_only')) {
                if ((code > 34 && code < 58) || code == 8 || code == 13) {
                    $(this).parent().find('.error-msg').slideUp('fast').remove();
                    $(this).parent().removeClass('error');
                    $(this).find('.error-icon').remove();
                    $(this).unbind('focus');
                }
            } else {
                $(this).parent().find('.error-msg').slideUp('fast').remove();
                $(this).parent().removeClass('error');
                $(this).find('.error-icon').remove();
                $(this).unbind('focus');
            }
        }
    });

    // Position the Error X icon in the correct spot on each field
    $('.field-wrap', dom).each(function() {
        try {
            var w = $(this).children('input[type=text], input[type=password]').outerWidth();
            if (w > 89) {
                if ($(this).hasClass('error')) {
                    $(this).find('.error-icon').remove();
                    $(this).prepend('<img class="error-icon" src="'+ABSOLUTE_PATH+'images/form-error.gif" alt="" style="left:' + (w - 16) + 'px" />');
                } else if ($(this).hasClass('okay')) {
                    $(this).find('.okay-icon').remove();
                    $(this).prepend('<img class="okay-icon" src="'+ABSOLUTE_PATH+'images/form-okay.gif" alt="" style="left:' + (w - 16) + 'px" />');
                }
            }
        } catch(e) {
        }
    });

    $('.field-wrap.error .field', dom).blur(function() {
        $(this).parent().find('.error-msg').slideUp();
    });

    var field_wrap = $('.checkbox', dom).parent();

    field_wrap.each(function() {
        if ($(this).hasClass('error')) {
            $(this).addClass('block-error');
        } else {

        }
    });

    // Use a timeout to make sure the entire page is loaded. Required for ajax forms
//    setTimeout(function() {
        $('.error .field:visible', dom).eq(0).focus();
//    }, 1000);

    // only allow one click on element, prevents double clicking issues
    $('.one-click', dom).click(function() {
        if ($(this).hasClass('clicked')) return false;
        $(this).addClass('clicked');
    });

    bloom.applyWaitOnClickListener(dom);
    bloom.applyBlockUIClickListener(dom);
}

function showFieldError(field) {
    var field = $(field);
    var errorMsg = field.parent().find('.error-msg');

    var w = field.width();
    var h = field.height();

    var modal = $('#nyroModalWrapper');
    var leftEdge = field.offset().left;
    if (modal.size() > 0) {
        leftEdge = (field.offset().left - modal.offset().left);
    }

    var err_h = errorMsg.height();
    var err_w = errorMsg.width();
    w = '-' + (Math.min(leftEdge, (err_w - w) / 2)) + 'px';
    h = '-' + (err_h + h - 2) + 'px' // 2px for borders

    errorMsg.css('margin-left', w).css('margin-top', h).slideDown();
}

function addFieldError(field, message) {
    if (!$(field).parent().hasClass("error")) {
        $(field).parent().addClass("error").append("<div class='note error-msg'>" + message + "</div>");
        showFieldError($(field));
    }
}
function removeFieldError(field) {
    if ($(field).parent().hasClass("error") || $(field).parent().hasClass("errors"))
        $(field).parent().removeClass("error").removeClass("errors").find(".note").remove();
}
function addGlobalError(message, target, callback) {
    addMessageToTop(message, target, 'message-error', callback)
}

function addGlobalMessage(message, target, callback) {
    addMessageToTop(message, target, 'message-okay', callback)
}

function addMessageToTop(message, target, style, callback) {
    var errorDiv = $('<div class="message ' + style + '"' + 'style="display:none;"/>');
    errorDiv.append($('<p/>').text(message));
    var targetEl = (target) ? target : $(".wrap:first");
    targetEl.prepend(errorDiv);
    $(window).scrollTop(targetEl.scrollTop());
    errorDiv.slideDown(callback);
}

function removeGlobalMessage() {
    $(".message-okay").slideUp();
}

function removeGlobalError() {
    $(".message-error").slideUp();
}

$.extend({
    getUrlVars: function(url) {
        var vars = [], hash;
        url = (url == null) ? window.location.href : url;
        var hashes = url.slice(url.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name, url) {
        url = (url == null) ? window.location.href : url;
        return $.getUrlVars(url)[name];
    },
    setUrlVar: function(name, newValue, url) {
        url = (url == null) ? window.location.href : url;
        var hashes = url.split(name+'=');
        if (hashes[1] != null) {
            var remaining = ((hashes[1].indexOf('&') != -1)) ? hashes[1].slice(hashes[1].indexOf('&')) : '';
            return hashes[0] + name + '=' + newValue + remaining;
        } else {
            return url;
        }
    },
    consoleLog: function(message, object) {
        if (console && console.log) {
            if (!object) {
                console.log("%s", message);
            } else {
                console.log("%s: %o", message, object);
            }
        }
        return this;
    }
});

function programScript() {
    $('.toggle').live('click', function() {
        if (!$(this).hasClass('expanded')) {
            $(this).parents('.additional .inside').animate({marginTop:'0px'})
            $(this).addClass('expanded')
            $(this).text('Hide additional information')
        } else {
            $(this).parents('.additional .inside').animate({marginTop:'-288px'})
            $(this).removeClass('expanded')
            $(this).text('Show me more information')
        }
        return false
    })

}

window.onload=function() {
    calcPageLoadEnd('Page Load ');
};

calcPageLoadEnd = function(trackingElement) {
    if (typeof(pageLoadStart) === 'undefined') return;
    var pageLoadEnd = new Date();
    // pageLoadStart should be defined at the top of the layout.
    var pageLoad = pageLoadEnd.getTime() - pageLoadStart.getTime();
    var lc;
    if(pageLoad<1000) lc = "Very Fast";
    else if (pageLoad<1500) lc = "Fast";
    else if (pageLoad<2000) lc = "Medium";
    else if (pageLoad<3000) lc = "Sluggish";
    else if (pageLoad<5000) lc = "Slow";
    else lc="Very Slow";
    var className = lc.replace(/\s/g, "").toLowerCase();
    var eclosingDiv = $("#page_load_time");
    if (eclosingDiv.length == 0) {
        enclosingDiv = $("<div/>").attr('id', 'page_load_time');
        $('body').append(enclosingDiv);
    }
    var newDiv = $("<div/>").append(trackingElement + ': ' + pageLoad + ' (ms) ' + lc + '<br/>').removeClass().addClass(className);
    enclosingDiv.append(newDiv);
};

/**
 * add functions of the same name to an object, effectively creating overloaded functions
 * @param object
 * @param name
 * @param fn
 */
bloom.addMethod = function(object, name, fn) {
    var old = object[name];
    object[name] = function() {
        if (fn.length == arguments.length) {
            return fn.apply(this, arguments);
        } else if (typeof old == 'function') {
            return old.apply(this, arguments);
        }
    };
};

/**
 * get object ready for posting to grails action
 * @param object
 */
bloom._cleanObjectForPosting = function(object) {
    delete object.errors;
    return object;
}

bloom.addMethod(bloom, 'cleanObjectForPosting', function(object) {
    bloom._cleanObjectForPosting(object);
});

bloom.addMethod(bloom, 'cleanObjectForPosting', function(i, value) {
    bloom._cleanObjectForPosting(value);
});

bloom.getPostableObject = function(object) {
    var objectCopy = $.extend({}, object, true/*deep*/);
    bloom.cleanObjectForPosting(objectCopy);
    for (var propertyKey in objectCopy) {
        if (objectCopy.hasOwnProperty(propertyKey)) {
            var propertyValue = objectCopy[propertyKey];
            if( Object.prototype.toString.call(propertyValue) === '[object Array]') {
                $.each(propertyValue, bloom.cleanObjectForPosting);
            } else if (Object.prototype.toString.call(propertyValue) === '[object Object]') {
                bloom.cleanObjectForPosting(propertyValue);
            } else if (Object.prototype.toString.call(propertyValue) === '[object Null]') {
                // need this, otherwise we'll get errors like:
                // Cannot cast object 'null' with class 'org.codehaus.groovy.grails.web.json.JSONObject$Null' to class
                objectCopy[propertyKey] = {};
            }
        }
    }
    return objectCopy;
};