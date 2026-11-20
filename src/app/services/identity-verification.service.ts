import { inject, Injectable } from '@angular/core';
import { PersonService } from './person.service';
import { composeDocumentNumber } from './validators';

export interface SigefirrhhWorkerRecord {
    documentNumber: string;
    fullName: string;
    status: 'ACTIVO' | 'EGRESADO';
    position?: string;
    phone?: string;
    email?: string;
}

export interface SaimeCitizenRecord {
    documentNumber: string;
    firstName: string;
    secondName?: string;
    lastName: string;
    secondLastName?: string;
    gender?: string;
    birthDate?: string;
}

export interface IdentityLookupResult<T> {
    found: boolean;
    active?: boolean;
    record?: T;
    message: string;
}

/**
 * Base local de consulta. Al integrar las APIs reales solo deben reemplazarse
 * verifyRepresentative() y lookupSaime() por las llamadas HTTP correspondientes.
 */
@Injectable({ providedIn: 'root' })
export class IdentityVerificationService {
    private readonly persons = inject(PersonService);

    verifyRepresentative(document: string): IdentityLookupResult<SigefirrhhWorkerRecord> {
        const normalized = this.normalize(document);

        if (!normalized) {
            return { found: false, active: false, message: 'Ingrese el nro. de documento del representante.' };
        }

        const worker = this.persons.persons().find((person) => this.normalize(person.documentNumber) === normalized);

        if (!worker) {
            return { found: false, active: false, message: 'El documento no está registrado en Sigefirrhh.' };
        }

        const active = worker.status === 'Activo';
        const record: SigefirrhhWorkerRecord = {
            documentNumber: worker.documentNumber,
            fullName: [worker.firstName, worker.secondName, worker.lastName, worker.secondLastName].filter(Boolean).join(' '),
            status: active ? 'ACTIVO' : 'EGRESADO',
            position: worker.type,
            phone: worker.phone,
            email: worker.email
        };

        return {
            found: true,
            active,
            record,
            message: active
                ? `${record.fullName} está ACTIVO en Sigefirrhh. Se habilitó el registro de atención médica.`
                : `${record.fullName} aparece en Sigefirrhh con estatus ${record.status}. Debe estar ACTIVO para habilitar la atención médica.`
        };
    }

    lookupSaime(document: string): IdentityLookupResult<SaimeCitizenRecord> {
        const normalized = this.normalize(document);

        if (!normalized) {
            return { found: false, message: 'Ingrese el nro. de documento del beneficiario.' };
        }

        const worker = this.persons.persons().find((person) => this.normalize(person.documentNumber) === normalized);
        if (worker) {
            return {
                found: true,
                record: {
                    documentNumber: worker.documentNumber,
                    firstName: worker.firstName,
                    secondName: worker.secondName,
                    lastName: worker.lastName,
                    secondLastName: worker.secondLastName,
                    gender: worker.gender,
                    birthDate: worker.birthDate
                },
                message: `Datos consultados en SAIME para ${this.fullName(worker.firstName, worker.secondName, worker.lastName, worker.secondLastName)}.`
            };
        }

        for (const person of this.persons.persons()) {
            for (const member of person.familyMembers ?? []) {
                if (!member.hasDocument || !member.documentNumber?.trim()) {
                    continue;
                }
                const memberDocument = composeDocumentNumber(member.documentType ?? '', member.documentNumber);
                if (this.normalize(memberDocument) !== normalized) {
                    continue;
                }
                return {
                    found: true,
                    record: {
                        documentNumber: memberDocument,
                        firstName: member.firstName ?? '',
                        secondName: member.secondName,
                        lastName: member.lastName ?? '',
                        secondLastName: member.secondLastName,
                        gender: member.gender,
                        birthDate: member.birthDate
                    },
                    message: `Datos consultados en SAIME para ${this.fullName(member.firstName, member.secondName, member.lastName, member.secondLastName)}.`
                };
            }
        }

        return { found: false, message: 'No se encontró el documento en la data SAIME.' };
    }

    private fullName(firstName?: string, secondName?: string, lastName?: string, secondLastName?: string): string {
        return [firstName, secondName, lastName, secondLastName].filter(Boolean).join(' ') || 'el beneficiario';
    }

    private normalize(value: string): string {
        const clean = (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const match = /^([VEJGPC])(\d+)$/.exec(clean);
        return match ? `${match[1]}-${match[2]}` : clean;
    }
}
