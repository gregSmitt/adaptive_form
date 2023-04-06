(() => {
	"use strict";
	const POPUP_CLOSE_EVENT = "popup-close";
	const POPUP_OPEN_EVENT = "popup-open";
	const INCORRECT_DATA_EVENT = "incorrect-input-data-event";
	const CORRECT_DATA_EVENT = "correct-input-data-event";
	const DISABLE_SUBMIT_EVENT = "disable-submit-event";
	const ALLOW_SUBMIT_EVENT = "allow-submit-event";
	const EVENT_DATA_ATR = "data-event";
	const ID_DATA_ATR = "data-id";
	const FORM_DATA_ATR = "data-form";
	const INPUT_ID_DATA_ATR = "data-input-id";
	class Block {
		constructor(element, blockName) {
			this.element = element;
			this.blockName = blockName;
			this.broker = document.querySelector(".page");
		}
		generateEvent(eventName, detail) {
			this.broker.dispatchEvent(new CustomEvent(eventName, {
				detail
			}));
		}
	}
	class Button extends Block {
		constructor(element) {
			super(element, "button");
			const eventName = this.element.getAttribute(EVENT_DATA_ATR);
			const dataId = this.element.getAttribute(ID_DATA_ATR);
			this.formId = this.element.getAttribute(FORM_DATA_ATR);
			this.clickHandle(eventName, dataId);
			this.formErrorHandle();
		}
		clickHandle(eventName, dataId) {
			if (eventName) this.element.addEventListener("click", (e => {
				e.preventDefault();
				this.generateEvent(eventName, {
					id: dataId
				});
			}));
		}
		formErrorHandle() {
			if (this.formId) {
				const clickBlocker = e => {
					e.preventDefault();
				};
				this.broker.addEventListener(DISABLE_SUBMIT_EVENT, (e => {
					if (this.formId === e.detail.formId) this.disable(clickBlocker);
				}));
				this.broker.addEventListener(ALLOW_SUBMIT_EVENT, (e => {
					if (this.formId === e.detail.formId) this.allow(clickBlocker);
				}));
			}
		}
		disable(clickBlocker) {
			this.element.setAttribute("disabled", true);
			this.element.addEventListener("click", clickBlocker);
		}
		allow(clickBlocker) {
			this.element.removeAttribute("disabled");
			this.element.removeEventListener("click", clickBlocker);
		}
	}
	class Input extends Block {
		constructor(element) {
			super(element, "input");
			this.field = this.element.querySelector(".input__field");
			this.inputId = this.element.getAttribute(INPUT_ID_DATA_ATR);
			this.formId = this.element.getAttribute(FORM_DATA_ATR);
			this.blurHandle();
			this.focusHandle();
			this.initialValidate();
		}
		validationRules = {
			input_require: () => !("" === this.field.value.trim()),
			input_phone: () => {
				const regExp = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/;
				return regExp.test(this.field.value);
			},
			input_email: () => {
				const regExp = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
				return regExp.test(this.field.value);
			}
		};
		validate() {
			for (let key in this.validationRules) if (this.element.classList.contains(key)) {
				const isValid = this.validationRules[key]();
				if (!isValid) return false;
			}
			return true;
		}
		initialValidate() {
			const isValid = this.validate();
			if (!isValid) this.generateEvent(INCORRECT_DATA_EVENT, {
				formId: this.formId,
				inputId: this.inputId
			});
		}
		handleValidation() {
			const isValid = this.validate();
			if (isValid) this.setValid(); else this.setInvalid();
		}
		setInvalid() {
			if (!this.element.classList.contains(this.blockName + "_invalid")) this.element.classList.add(this.blockName + "_invalid");
			this.generateEvent(INCORRECT_DATA_EVENT, {
				formId: this.formId,
				inputId: this.inputId
			});
		}
		setValid() {
			this.generateEvent(CORRECT_DATA_EVENT, {
				formId: this.formId,
				inputId: this.inputId
			});
		}
		blurHandle() {
			this.field.addEventListener("blur", (() => {
				this.handleValidation();
			}));
		}
		focusHandle() {
			this.field.addEventListener("focus", (() => {
				this.element.classList.remove(this.blockName + "_invalid");
			}));
		}
	}
	class InputFile extends Block {
		constructor(element) {
			super(element, "input-file");
			this.allowedExtensions = ["png", "jpg"];
			this.formId = this.element.getAttribute(FORM_DATA_ATR);
			this.inputId = this.element.getAttribute(INPUT_ID_DATA_ATR);
			this.uploader = this.element.querySelector(`.${this.blockName}__input`);
			this.image = this.element.querySelector(`.${this.blockName}__preview`);
			this.baseImgUrl = this.image.src;
			this.clearButton = this.element.querySelector(`.${this.blockName}__cancel`);
			this.changeHandle();
			this.setInvalid();
			this.handleClearButtonClick();
		}
		renderImage(url) {
			this.image.src = url;
		}
		setValid() {
			this.generateEvent(CORRECT_DATA_EVENT, {
				inputId: this.inputId,
				formId: this.formId
			});
			if (!this.element.classList.contains(this.blockName + "_uploaded")) this.element.classList.add(this.blockName + "_uploaded");
			this.disableChange(true);
		}
		setInvalid() {
			this.generateEvent(INCORRECT_DATA_EVENT, {
				inputId: this.inputId,
				formId: this.formId
			});
			this.element.classList.remove(this.blockName + "_uploaded");
			this.disableChange(false);
		}
		handleClearButtonClick() {
			this.clearButton.addEventListener("click", (e => {
				e.preventDefault();
				this.clearInput();
			}));
		}
		clearInput() {
			this.uploader.value = "";
			this.renderImage(this.baseImgUrl);
			this.setInvalid();
		}
		checkFile() {
			const [file] = this.uploader.files;
			const extension = file.name.split(".").pop();
			if (file && this.allowedExtensions.find((ext => ext === extension))) {
				const reader = new FileReader;
				reader.readAsDataURL(file);
				reader.addEventListener("load", (() => {
					this.renderImage(URL.createObjectURL(file));
					this.setValid();
				}));
				reader.addEventListener("error", (() => {
					this.setInvalid();
				}));
			} else this.setInvalid();
		}
		changeHandle() {
			this.element.addEventListener("change", (() => {
				this.checkFile();
			}));
		}
		disableChange(isDisabled) {
			if (isDisabled) this.element.addEventListener("click", this.clickDisabler); else this.element.removeEventListener("click", this.clickDisabler);
		}
		clickDisabler(e) {
			e.preventDefault();
		}
	}
	class Form extends Block {
		constructor(element) {
			super(element, "form");
			this.id = this.element.getAttribute(ID_DATA_ATR);
			this.subscribeBroker();
			this.invalidInputIds = new Set;
		}
		subscribeBroker() {
			this.broker.addEventListener(INCORRECT_DATA_EVENT, (e => {
				if (e.detail.formId === this.id) {
					this.addInvalidId(e.detail.inputId);
					this.handleInvalidList();
				}
			}));
			this.broker.addEventListener(CORRECT_DATA_EVENT, (e => {
				if (e.detail.formId === this.id) {
					this.removeInvalidId(e.detail.inputId);
					this.handleInvalidList();
				}
			}));
		}
		addInvalidId(inputId) {
			this.invalidInputIds.add(inputId);
		}
		removeInvalidId(inputId) {
			this.invalidInputIds.delete(inputId);
		}
		handleInvalidList() {
			if (this.invalidInputIds.size) this.disableSubmit(); else this.allowSubmit();
		}
		allowSubmit() {
			this.generateEvent(ALLOW_SUBMIT_EVENT, {
				formId: this.id
			});
		}
		disableSubmit() {
			this.generateEvent(DISABLE_SUBMIT_EVENT, {
				formId: this.id
			});
		}
	}
	class Popup extends Block {
		constructor(element) {
			super(element, "popup");
			this.dataId = this.element.getAttribute(ID_DATA_ATR);
			this.subscribeBroker();
			this.createCloseButton();
			this.hireMissClick();
		}
		show() {
			this.element.scrollTop = 0;
			this.element.classList.add(this.blockName + "_active");
			this.broker.style.overflow = "hidden";
		}
		hide() {
			this.element.classList.remove(this.blockName + "_active");
			this.broker.style.overflow = "auto";
		}
		subscribeBroker() {
			this.broker.addEventListener(POPUP_CLOSE_EVENT, (e => {
				if (e.detail.id == this.dataId) this.hide();
			}));
			this.broker.addEventListener(POPUP_OPEN_EVENT, (e => {
				if (e.detail.id == this.dataId) this.show();
			}));
		}
		createCloseButton() {
			this.closeButton = this.element.querySelector(".popup__close");
			this.closeButton.addEventListener("click", (() => {
				this.hide();
			}));
		}
		hireMissClick() {
			const popupWrapper = this.element.querySelector(".popup__wrapper");
			const outsideClickListener = event => {
				if (!popupWrapper.contains(event.target) && isVisible(popupWrapper)) {
					this.hide();
					removeClickListener();
				}
			};
			const isVisible = elem => !!elem && !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
			const removeClickListener = () => {
				document.removeEventListener("click", outsideClickListener);
			};
			this.element.addEventListener("click", outsideClickListener);
		}
	}
	window.onload = function () {
		const popups = document.querySelectorAll(".popup");
		const forms = document.querySelectorAll(".form");
		const buttons = document.querySelectorAll(".button");
		const inputs = document.querySelectorAll(".input");
		const inputFiles = document.querySelectorAll(".input-file");
		applyToCollection(forms, Form);
		applyToCollection(popups, Popup);
		applyToCollection(buttons, Button);
		applyToCollection(inputs, Input);
		applyToCollection(inputFiles, InputFile);
	};
	function applyToCollection(collection, Class) {
		let i;
		for (i in collection) if (collection[i].classList) new Class(collection[i]);
	}
})
	();