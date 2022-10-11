import sys
from collections.abc import Callable, Iterable, Mapping
from types import TracebackType
from typing import Any, List, Optional, Type, TypeVar, Union

_T = TypeVar("_T")

__all__ = [
    "get_ident",
    "active_count",
    "Condition",
    "current_thread",
    "enumerate",
    "main_thread",
    "TIMEOUT_MAX",
    "Event",
    "Lock",
    "RLock",
    "Semaphore",
    "BoundedSemaphore",
    "Thread",
    "Barrier",
    "BrokenBarrierError",
    "Timer",
    "ThreadError",
    "setprofile",
    "settrace",
    "local",
    "stack_size",
]

if sys.version_info >= (3, 10):
    def gettrace() -> Optional[TraceFunction]: ...
    def getprofile() -> Optional[ProfileFunction]: ...
    __all__ += ["getprofile", "gettrace"]

if sys.version_info >= (3, 8):
    from _thread import get_native_id as get_native_id
    __all__ += ["ExceptHookArgs", "excepthook", "get_native_id"]

ProfileFunction = Callable[..., Any]
TraceFunction = Callable[..., Any]
_profile_hook: Optional[ProfileFunction]

def active_count() -> int: ...
def current_thread() -> Thread: ...
def get_ident() -> int: ...
def enumerate() -> List[Thread]: ...
def main_thread() -> Thread: ...

def settrace(func: TraceFunction) -> None: ...
def setprofile(func: Optional[ProfileFunction]) -> None: ...
def stack_size(size: int = ...) -> int: ...

TIMEOUT_MAX: float

class ThreadError(Exception): ...

class local:
    def __getattribute__(self, __name: str) -> Any: ...
    def __setattr__(self, __name: str, __value: Any) -> None: ...
    def __delattr__(self, __name: str) -> None: ...

class Thread:
    name: Optional[str]
    start_time: float
    @property
    def ident(self) -> Optional[int]: ...
    daemon: bool
    def __init__(
        self,
        group: None = ...,
        target: Optional[Callable[..., object]] = ...,
        name: Optional[str] = ...,
        args: Iterable[Any] = ...,
        kwargs: Optional[Mapping[str, Any]] = ...,
        *,
        daemon: Optional[bool] = ...,
    ) -> None: ...
    def start(self) -> None: ...
    def run(self) -> None: ...
    def join(self, timeout: Optional[float] = ...) -> None: ...
    if sys.version_info >= (3, 8):
        @property
        def native_id(self) -> Optional[int]: ...  # only available on some platforms

    def is_alive(self) -> bool: ...
    if sys.version_info < (3, 9):
        def isAlive(self) -> bool: ...

class _DummyThread(Thread):
    def __init__(self) -> None: ...

class Lock:
    def __init__(self) -> None: ...
    def __enter__(self) -> bool: ...
    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> None: ...
    def acquire(
        self, blocking: bool = ..., timeout: float = ...
    ) -> bool: ...
    def release(self) -> None: ...
    def locked(self) -> bool: ...

class _RLock:
    def __init__(self) -> None: ...
    def acquire(self, blocking: bool = ..., timeout: float = ...) -> bool: ...
    def release(self) -> None: ...
    __enter__ = acquire
    def __exit__(
        self,
        t: Optional[Type[BaseException]],
        v: Optional[BaseException],
        tb: Optional[TracebackType]
    ) -> None: ...

RLock = _RLock

class Condition:
    def __init__(self, lock: Optional[Union[Lock, _RLock]] = ...) -> None: ...
    def __enter__(self) -> bool: ...
    def __exit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType]
    ) -> None: ...
    def acquire(self, blocking: bool = ..., timeout: float = ...) -> bool: ...
    def release(self) -> None: ...
    def wait(self, timeout: Optional[float] = ...) -> bool: ...
    def wait_for(
        self, predicate: Callable[[], _T], timeout: Optional[float] = ...
    ) -> _T: ...
    def notify(self, n: int = ...) -> None: ...
    def notify_all(self) -> None: ...

class Semaphore:
    _value: int
    def __init__(self, value: int = ...) -> None: ...
    def __exit__(
        self,
        t: Optional[Type[BaseException]],
        v: Optional[BaseException],
        tb: Optional[TracebackType]
    ) -> None: ...
    def acquire(
        self, blocking: bool = ..., timeout: Optional[float] = ...
    ) -> bool: ...
    def __enter__(
        self, blocking: bool = ..., timeout: Optional[float] = ...
    ) -> bool: ...
    if sys.version_info >= (3, 9):
        def release(self, n: int = ...) -> None: ...
    else:
        def release(self) -> None: ...

class BoundedSemaphore(Semaphore): ...

class Event:
    def __init__(self) -> None: ...
    def is_set(self) -> bool: ...
    def set(self) -> None: ...
    def clear(self) -> None: ...
    def wait(self, timeout: Optional[float] = ...) -> bool: ...

if sys.version_info >= (3, 8):
    from _thread import _excepthook, _ExceptHookArgs

    excepthook = _excepthook
    ExceptHookArgs = _ExceptHookArgs

class Timer(Thread):
    args: Iterable[Any]
    finished: Event
    function: Callable[..., Any]
    interval: float
    kwargs: Mapping[str, Any]

    def __init__(
        self,
        interval: float,
        function: Callable[..., object],
        args: Optional[Iterable[Any]] = ...,
        kwargs: Optional[Mapping[str, Any]] = ...,
    ) -> None: ...
    def cancel(self) -> None: ...

class Barrier:
    @property
    def parties(self) -> int: ...
    @property
    def n_waiting(self) -> int: ...
    @property
    def broken(self) -> bool: ...
    def __init__(
        self,
        parties: int,
        action: Optional[Callable[[], None]] = ...,
        timeout: Optional[float] = ...
    ) -> None: ...
    def wait(self, timeout: Optional[float] = ...) -> int: ...
    def reset(self) -> None: ...
    def abort(self) -> None: ...

class BrokenBarrierError(RuntimeError): ...
