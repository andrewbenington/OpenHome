import { IconBaseProps } from 'react-icons'
import { AiFillEdit } from 'react-icons/ai'
import { BiMove } from 'react-icons/bi'
import { BsGrid3X3Gap, BsGrid3X3GapFill } from 'react-icons/bs'
import { IoGrid } from 'react-icons/io5'
import {
  MdArrowBack,
  MdArrowDropDown,
  MdArrowForward,
  MdArrowForwardIos,
  MdCheckCircle,
  MdClear,
  MdCompareArrows,
  MdCreateNewFolder,
  MdDataObject,
  MdError,
  MdFilterListAlt,
  MdGrid4X4,
  MdInfo,
  MdMoreVert,
  MdSelectAll,
} from 'react-icons/md'
import {
  RiCamera2Fill,
  RiCamera2Line,
  RiCompassFill,
  RiCompassLine,
  RiDashboard2Fill,
  RiDashboard2Line,
  RiDashboardFill,
  RiDashboardLine,
  RiFileMarkedFill,
  RiFileMarkedLine,
  RiHome2Fill,
  RiHome2Line,
  RiSettings5Fill,
  RiSettings5Line,
} from 'react-icons/ri'
import { TiMinus, TiPlus } from 'react-icons/ti'

export const AddFolderIcon = MdCreateNewFolder
export const MenuIcon = MdMoreVert
export const RemoveIcon = TiMinus
export const EditIcon = AiFillEdit
export const MoveIcon = BiMove
export const AddIcon = TiPlus
export const ClearIcon = MdClear

export const GridIcon = MdGrid4X4
export const CardsIcon = IoGrid

export const ArrowLeftIcon = MdArrowBack
export const ArrowRightIcon = MdArrowForward
export const ArrowLeftRightIcon = MdCompareArrows
export const DropdownArrowIcon = MdArrowDropDown
export const FilterIcon = MdFilterListAlt

export const ExpandArrowIcon = MdArrowForwardIos

export const ErrorIcon = MdError
export const InfoIcon = MdInfo
export const SuccessIcon = MdCheckCircle

export const DevIcon = MdDataObject

export const SelectIcon = MdSelectAll

// eslint-disable-next-line react-refresh/only-export-components
export const AppTabIconsActive = {
  Home: (props: IconBaseProps) => <RiHome2Fill {...props} className="active-tab" />,
  Tracked: (props: IconBaseProps) => <RiCompassFill {...props} className="active-tab" />,
  List: (props: IconBaseProps) => <BsGrid3X3GapFill {...props} className="active-tab" />,
  Pokedex: (props: IconBaseProps) => <RiFileMarkedFill {...props} className="active-tab" />,
  Plugins: (props: IconBaseProps) => <RiCamera2Fill {...props} className="active-tab" />,
  Settings: (props: IconBaseProps) => <RiSettings5Fill {...props} className="active-tab" />,
  AppState: (props: IconBaseProps) => <RiDashboard2Fill {...props} className="active-tab" />,
  ComponentDebug: (props: IconBaseProps) => <RiDashboardFill {...props} className="active-tab" />,
}

// eslint-disable-next-line react-refresh/only-export-components
export const AppTabIconsInactive: typeof AppTabIconsActive = {
  Home: (props: IconBaseProps) => <RiHome2Line {...props} className="inactive-tab" />,
  Tracked: (props: IconBaseProps) => <RiCompassLine {...props} className="inactive-tab" />,
  List: (props: IconBaseProps) => <BsGrid3X3Gap {...props} className="inactive-tab" />,
  Pokedex: (props: IconBaseProps) => <RiFileMarkedLine {...props} className="inactive-tab" />,
  Plugins: (props: IconBaseProps) => <RiCamera2Line {...props} className="inactive-tab" />,
  Settings: (props: IconBaseProps) => <RiSettings5Line {...props} className="inactive-tab" />,
  AppState: (props: IconBaseProps) => <RiDashboard2Line {...props} className="inactive-tab" />,
  ComponentDebug: (props: IconBaseProps) => <RiDashboardLine {...props} className="inactive-tab" />,
}
