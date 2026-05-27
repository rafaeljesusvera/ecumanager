import type { Icon } from '@phosphor-icons/react';
import {
  HouseIcon,
  HorseIcon,
  GraduationCapIcon,
  BookOpenTextIcon,
  CalendarBlankIcon,
  TrophyIcon,
  NewspaperIcon,
  TicketIcon,
  MicrophoneStageIcon,
  UserIcon,
  MedalIcon,
  ClipboardTextIcon,
  QuestionIcon,
  CircleIcon,
} from '@phosphor-icons/react/dist/ssr';

const map: Record<string, Icon> = {
  House: HouseIcon,
  Horse: HorseIcon,
  GraduationCap: GraduationCapIcon,
  BookOpenText: BookOpenTextIcon,
  CalendarBlank: CalendarBlankIcon,
  Trophy: TrophyIcon,
  Newspaper: NewspaperIcon,
  Ticket: TicketIcon,
  MicrophoneStage: MicrophoneStageIcon,
  User: UserIcon,
  Medal: MedalIcon,
  ClipboardText: ClipboardTextIcon,
  Question: QuestionIcon,
};

export function NavIcon({
  name,
  size = 18,
  weight = 'regular',
  className,
}: {
  name: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'duotone' | 'fill';
  className?: string;
}) {
  const Icon = map[name] ?? CircleIcon;
  return <Icon size={size} weight={weight} className={className} />;
}
