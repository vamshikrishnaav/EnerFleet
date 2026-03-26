$(document).ready(function () {

  /* ---------- Toast ---------- */
  if (!$("#formToast").length) {
    $("body").append(`
      <div id="formToast" style="
        position: fixed;
        top: 20px;
        right: 20px;
        color: white;
        padding: 10px 18px;
        display: none;
        z-index: 9999;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 14px;
      "></div>
    `);
  }

  function showToast(msg, isError) {
    $("#formToast")
      .css("background-color", isError ? "#c0392b" : "#009a4e")
      .text(msg)
      .fadeIn(300)
      .delay(3000)
      .fadeOut(300);
  }

  /* ---------- Helpers ---------- */
  const phoneRegex = /^(?:\+91[-\s]?|0)?[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const $form = $(".contact-section .contact-form");

  function getError($input) {
    let $err = $input.next(".ef-error");
    if (!$err.length) {
      $err = $('<small class="ef-error" style="color:#c0392b;font-size:12px;display:block;margin-top:3px;"></small>');
      $input.after($err);
    }
    return $err;
  }

  function clearErrors() {
    $form.find(".ef-error").text("");
  }

  /* ---------- Validation ---------- */
  function validateForm() {
    let isValid = true;
    clearErrors();

    $form.find(".form-input").each(function () {
      const $input = $(this);

      if (!$input.attr("data-touched")) return;

      const val = $input.val().trim();

      // Select field
      if ($input.is("select")) {
        if (!val) {
          getError($input).text("Please select a business type");
          isValid = false;
        }
        return;
      }

      // Required check
      if (!val) {
        getError($input).text(($input.attr("placeholder") || "This field") + " is required");
        isValid = false;
        return;
      }

      // Email
      if ($input.attr("type") === "email" && !emailRegex.test(val)) {
        getError($input).text("Enter a valid email");
        isValid = false;
      }

      // Phone
      if ($input.attr("type") === "tel" && !phoneRegex.test(val)) {
        getError($input).text("Enter a valid mobile number");
        isValid = false;
      }
    });

    return isValid;
  }

  /* ---------- Mark touched on blur ---------- */
  $form.find(".form-input").on("blur", function () {
    $(this).attr("data-touched", "true");
    validateForm();
  });

  /* ---------- Submit ---------- */
  $form.on("submit", function (e) {
    e.preventDefault();

    $form.find(".form-input").attr("data-touched", "true");
    if (!validateForm()) return;

    const $btn = $form.find(".submit-btn");
    const originalText = $btn.html();

    // Add spinner keyframes once
    if (!document.getElementById("ef-spinner-style")) {
      $("head").append(`<style id="ef-spinner-style">@keyframes ef-spin { to { transform: rotate(360deg); } }</style>`);
    }

    $btn
      .html(`<span style="display:inline-block;width:14px;height:14px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:ef-spin .6s linear infinite;margin-right:6px;vertical-align:middle;"></span> Submitting...`)
      .prop("disabled", true);

    $.ajax({
      url:     $form.attr("action"),
      method:  "POST",
      data:    $form.serialize(),
      headers: { "Accept": "application/json" },
      success: function () {
        showToast("Form submitted successfully!");
        $form[0].reset();
        clearErrors();
        $form.find(".form-input").removeAttr("data-touched");
      },
      error: function () {
        showToast("Submission failed. Please try again.", true);
      },
      complete: function () {
        $btn.html(originalText).prop("disabled", false);
      }
    });
  });

});