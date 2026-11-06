import { projects } from '../../../../../src/content/projects';
import { services, serviceVisual } from '../../../../../src/content/services';
import { tr } from '../../../../../src/i18n/ui';
export const data = { projects, services, visuals: Object.fromEntries(services.map((s) => [s.id, serviceVisual(s)])), ui: { en: tr('en'), de: tr('de'), es: tr('es') } };
