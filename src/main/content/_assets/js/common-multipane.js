/*******************************************************************************
 * Copyright (c) 2018 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
// The background is shortened by 200px
var backgroundSizeAdjustment = 200;
var twoColumnBreakpoint = 1170;
// var scrollLock = false;

function inSingleColumnView(){
    return($(window).width() <= twoColumnBreakpoint);
}

function inMobile(){
    return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

function heightOfVisibleBackground() {
    var result;
    if(isBackgroundBottomVisible()) {
        var scrollTop = $(window).scrollTop();
        result = getBackgroundAbsoluteBottomPosition() - scrollTop;
    } else {
        // Assume the background is filling up the entire viewport
        result = $(window).height();
    }
    return result;
}

// Get the absolute position of the bottom of the dark background regardless
// of whether the bottom is in the browser's viewport
function getBackgroundAbsoluteBottomPosition() {
    var background = $('#background_container'),
    elementTop = background.offset().top,
    elementBottomPosition = elementTop + (background.outerHeight() - backgroundSizeAdjustment);
    return elementBottomPosition;
}

// Determine if the bottom of the visible dark background is now visible
// in the browser's viewport.
function isBackgroundBottomVisible() {
    var background = $('#background_container'),
        currentTopPosition = $(window).scrollTop(),
        currentBottomPosition = currentTopPosition + $(window).height(),
        elementBottomPosition = getBackgroundAbsoluteBottomPosition(),
        visibleBottom = currentBottomPosition > elementBottomPosition;
    return visibleBottom;
}

// Resize the guide sections so that there is clear separation between each
// section and the code column transitions better by making the section height
// in two and three column view at least as tall as the viewport.
function resizeGuideSections() {
        // Two column view or three column view.
    if ($(window).width() > twoColumnBreakpoint) {
        var viewportHeight = window.innerHeight;
        var headerHeight = $('header').height();
        var sectionTitleHeight = $("#guide_content h2").first().height();
        var newSectionHeight = viewportHeight - headerHeight - (2 * sectionTitleHeight);
        $('.sect1:not(#guide_meta):not(#related-guides)').css({
                'min-height': newSectionHeight + 'px'
        });
    }
    // Use initial height for single column view / mobile
    else {
            $('.sect1:not(#guide_meta):not(#related-guides)').css({
                'min-height': 'initial'
        });
    }
}
    
function handleFloatingCodeColumn() {
    if($(window).width() > twoColumnBreakpoint) {
        // CURRENTLY IN DESKTOP VIEW
        if(isBackgroundBottomVisible()) {
            // Set the bottom of the code column to the distance between the top of the end of guide section and the bottom of the page.
            var windowHeight = window.innerHeight;
            var relatedGuidesTopPosition = $("#end_of_guide")[0].getBoundingClientRect().top;
            if(relatedGuidesTopPosition){
                var bottom = windowHeight - relatedGuidesTopPosition;
                $("#code_column").css('bottom', bottom + 'px');
            } else {
                $("#code_column").css('bottom', 'auto');
            }
        } else {
            // The entire viewport is filled with the code column
            $("#code_column").css('bottom', '0');
        }
    }
}

/* Detect if the user has scrolled downwards into a new section and apply intertia resistence. */
function checkForIntertiaScrolling (event){
    var origEvent = event.originalEvent;
    var target = origEvent.target;
    var dir;
    if(origEvent.deltaY){
        dir = (origEvent.deltaY) > 0 ? 'down' : 'up';
    } else if(origEvent.detail){
        // Firefox
        dir = (origEvent.detail) > 0 ? 'down' : 'up';
    }
    var originalDelta = origEvent.wheelDelta || -origEvent.detail || -origEvent.deltaY;
    var delta = origEvent.wheelDelta / 6 || -origEvent.detail / 3 || -origEvent.deltaY;

    // If scrolling down, check if the section header is coming into view
    if(dir && dir == 'down'){
        var section_headers = $('.sect1:not(#guide_meta) h2');
        section_headers.each(function(index) {
            var elem = $(section_headers.get(index));
            var scrollTop = $(window).scrollTop();
            var windowHeight = $(window).height();
            var navbarHeight = $("nav").height();
            var rect = elem[0].getBoundingClientRect();
            var top = rect.top;
            var bottom = rect.bottom;

            var sectionOutOfView = (top > windowHeight);
            var sectionWillBeScrolledPast = ((top + originalDelta) > 0) && ((top + originalDelta) < windowHeight) && ((bottom + originalDelta) < windowHeight);

            // Check if part of a new section is coming into view or if the original scroll event would have scrolled past a section start.
            if((top > 0 && top < windowHeight && bottom > windowHeight) || (sectionOutOfView && sectionWillBeScrolledPast)){
                // New section is coming into view. Start slowing down scrolling.
                // Check if scroll delta is at least a certain amount before stopping the default scroll, to allow for trackpad acceleration. If each scroll event.preventDefault() is called while scrolling on a trackpad, the delta is too small and the trackpad acceleration does not take place.
                if(Math.abs(delta) >= 5){
                    event.preventDefault();
                    event.stopPropagation();  
                    $('html, body').stop().animate({
                        scrollTop: scrollTop - delta
                    });                    
                    return false;
                }                          
            }  else if(top > 0 && top < windowHeight && bottom < windowHeight && bottom > (windowHeight - 200)){
                event.preventDefault();
                event.stopPropagation();
                // Section header is now scrolled into view
                // Snap to the top of the element
                $('html, body').stop().animate({
                    scrollTop: elem.offset().top - navbarHeight
                 });                 
                return false;
            }      
        });
    }
}

/* Find the section that is most visible in the viewport and return the id */
function getScrolledVisibleSectionID() {
    var id = null;
    var maxVisibleSectionHeight = 0;

    // Multipane view
    if ($(window).width() > twoColumnBreakpoint) {
        var sections = $('.sect1:not(#guide_meta)');
        sections.each(function(index) {
            var elem = $(sections.get(index));
            var windowHeight   = $(window).height();
            var elemHeight = elem.outerHeight();
            var rect = elem[0].getBoundingClientRect();
            var top = rect.top; 
            var bottom = rect.bottom;
            var visibleElemHeight = 0;           
            if(top > 0){
                 // Top of element is below the top of the viewport
                 // Calculate the visible element height as the min of the whole element (if the whole element is in the viewport) and the top of the element to the bottom of the window (if only part of the element is visible and extends beyond the bottom of the viewport).
                 visibleElemHeight = Math.min(elemHeight, windowHeight - top);
            }
            else {
                // Top of element is at or above the top of the viewport
                // Calculate the visible element height as the min between the bottom (if the element starts above the viewport and ends before the bottom of the viewport) or the windowHeight(the element extends beyond the top and bottom of viewport in both diretions).
                visibleElemHeight = Math.min(bottom, windowHeight);
            }
            if(visibleElemHeight > maxVisibleSectionHeight){
                maxVisibleSectionHeight = visibleElemHeight;
                id = elem.children('h2')[0].id;
            }
        });
    }
    return id;
}

// Copy over content that should be shown in a different section than where it
// is generated.
function createEndOfGuideContent(){
    var leftSide = $("#end_of_guide_left_section");
    var rightSide = $("#end_of_guide_right_section");
    var whatYouLearned = $("#great-work-you-re-done, #great-work-youre-done").siblings().find('p').clone();
    leftSide.prepend(whatYouLearned);
    $("#great-work-you-re-done, #great-work-youre-done").parent().remove(); // Remove section from the main guide column.
    $("#toc_container a[href='#great-work-you-re-done'], #toc_container a[href='#great-work-youre-done']").parent().remove(); // Remove from TOC.

    // Concatenate the guide title and guide attribution license and append it to the end of guide.
    var guideAttribution = $("#guide-attribution").siblings().find('p').text();
    if(guideAttribution){
        var guideTitle = $("#guide_title").text();
        var concatenatedAttribution = guideTitle + " is licensed under " + guideAttribution;
        $("#guide_attribution").text(concatenatedAttribution);
        $("#guide-attribution").parent().remove();
        $("#toc_container a[href='#guide-attribution']").parent().remove(); // Remove from TOC.
    }

    var relatedLinks = $("#related-links").siblings().find('p').clone();
    rightSide.append(relatedLinks);
    $("#related-links").parent().remove(); // Remove section from the main guide column.
    $("#toc_container a[href='#related-links']").parent().remove(); // Remove from TOC.
}


$(document).ready(function() {
    function handleDownArrow() {
        if ($(window).width() < 1171) {
            $("#down_arrow").hide();
            return;
        }
        var atTop = $(window).scrollTop() === 0;
        atTop ? $("#down_arrow").fadeIn() : $("#down_arrow").fadeOut();
    }
        
    function addGuideRatingsListener(){
        $("#feedback_ratings img").on('click', function(event){
            var rating = $(this).data('guide-rating');
            // Send rating to google analytics
            // The first parameter '1' is the slot for the custom variable
            // The last parameter '3' is opt_scope is which is page level storage
            if(typeof ga === "function"){
                ga(1, "Guide Review", rating, 3);
            }
            $("#feedback_ratings img").not($(this)).css('opacity', '.25');
            $(this).css('opacity', '1');
        });
    }

    // Adjust the window for the sticky header when requesting a specific section.
    function shiftWindow() {
        scrollBy(0, -100);
    }

    if (location.hash){
        shiftWindow();
        handleFloatingTableOfContent();
        var id = location.hash.substring(1);
        updateTOCHighlighting(id);
    }

    window.addEventListener("hashchange", function(){
        shiftWindow();
        var id = location.hash.substring(1);
        updateTOCHighlighting(id);
    });

    $(window).on('resize', function(){
        handleFloatingTableOfContent(); // Handle table of content view changes.
        handleDownArrow();
        resizeGuideSections();
        handleFloatingCodeColumn();
    });

    $(window).on('scroll', function(event) {
        handleDownArrow();
        handleFloatingTableOfContent(); 
        handleFloatingCodeColumn();
    });

    $(window).on('load', function(){
        handleFloatingTableOfContent();
        addGuideRatingsListener();
        handleFloatingCodeColumn(); // Must be called last to calculate how tall the code column is.
    });
});