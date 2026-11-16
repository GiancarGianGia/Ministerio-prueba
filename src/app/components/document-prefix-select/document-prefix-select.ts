import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DocumentPrefixOption, USER_DOCUMENT_PREFIX_OPTIONS } from '@/app/services/models';

@Component({
    selector: 'app-document-prefix-select',
    standalone: true,
    imports: [CommonModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DocumentPrefixSelect),
            multi: true
        }
    ],
    template: `
        <div class="doc-prefix" role="radiogroup" [attr.aria-label]="ariaLabel" [class.doc-prefix-disabled]="disabled">
            @for (option of options; track option.value) {
                <button
                    type="button"
                    role="radio"
                    class="doc-prefix-option"
                    [class.doc-prefix-option-active]="value === option.value"
                    [attr.aria-checked]="value === option.value"
                    [attr.title]="option.title"
                    [disabled]="disabled"
                    (click)="select(option.value)"
                >
                    {{ option.label }}
                </button>
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: inline-flex;
                flex: 0 0 auto;
            }

            .doc-prefix {
                display: inline-flex;
                align-items: stretch;
                height: 2.5rem;
                border: 1px solid #cbd5e1;
                border-radius: 0.5rem;
                background: #fff;
                overflow: hidden;
            }

            .doc-prefix-option {
                min-width: 2rem;
                padding: 0 0.45rem;
                border: 0;
                border-right: 1px solid #e2e8f0;
                background: transparent;
                color: #475569;
                font-size: 0.76rem;
                font-weight: 800;
                line-height: 1;
                cursor: pointer;
                transition:
                    background 0.15s ease,
                    color 0.15s ease;
            }

            .doc-prefix-option:last-child {
                border-right: 0;
            }

            .doc-prefix-option:hover:not(:disabled):not(.doc-prefix-option-active) {
                background: #f1f5f9;
            }

            .doc-prefix-option-active {
                background: #2563eb;
                color: #fff;
            }

            .doc-prefix-option:focus-visible {
                outline: 2px solid #93c5fd;
                outline-offset: -2px;
            }

            .doc-prefix-option:disabled {
                cursor: not-allowed;
                opacity: 0.6;
            }

            .doc-prefix-disabled {
                background: #f8fafc;
            }
        `
    ]
})
export class DocumentPrefixSelect implements ControlValueAccessor {
    @Input() options: DocumentPrefixOption[] = USER_DOCUMENT_PREFIX_OPTIONS;

    @Input() ariaLabel = 'Tipo de documento de identidad';

    value = '';

    disabled = false;

    private onChange: (value: string) => void = () => undefined;

    private onTouched: () => void = () => undefined;

    writeValue(value: string | null): void {
        this.value = value ?? '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    select(prefix: string): void {
        if (this.disabled || this.value === prefix) {
            return;
        }
        this.value = prefix;
        this.onChange(prefix);
        this.onTouched();
    }
}
