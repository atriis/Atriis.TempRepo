/**
 * Shared Element Plus selector fragments.
 *
 * A disabled Element Plus el-select signals its state in several places. The `is-disabled` class on
 * the `.el-select` ROOT is a SELF class — test it on the element itself, not via this selector. The
 * remaining signals sit on descendants (the inner `.el-select__wrapper` gets `is-disabled` /
 * `aria-disabled="true"`, and an `.el-input`-based field gets `.el-input.is-disabled`), so this
 * fragment is matched as a DESCENDANT of a field container or of the el-select root.
 *
 * Kept in one place so the profile dynamic-field check (ProfilePage.isDynamicFieldEditable) and the
 * checkout reference-field check (DynamicAndReferenceFieldsPage.isFieldDisabled) can't drift apart
 * when a future Element Plus upgrade changes the disabled markup.
 */
const EL_SELECT_DISABLED_INNER =
  '.el-select__wrapper.is-disabled, .el-select__wrapper[aria-disabled="true"], .el-input.is-disabled';

/**
 * Any disabled control a reference field can render, matched as a DESCENDANT of the field container:
 * a disabled el-select (root `is-disabled` plus the inner signals above), a disabled el-input /
 * el-textarea (textbox, autocomplete, textarea fields), and a natively disabled `<input>` (checkbox
 * fields render plain checkboxes with `:disabled`). A field with none of these is editable.
 */
const EL_CONTROL_DISABLED =
  `.el-select.is-disabled, ${EL_SELECT_DISABLED_INNER}, .el-textarea.is-disabled, input[disabled], textarea[disabled]`;

module.exports = { EL_SELECT_DISABLED_INNER, EL_CONTROL_DISABLED };
