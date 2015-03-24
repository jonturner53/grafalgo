SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
BIN := ~/bin
CXXFLAGS := -Wall ${ARCH} -O2 -std-c++0x

all:
	make -C basic       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C hash       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C graphs      BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C heaps       BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C searchTrees BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all
	make -C advanced    BIN='${BIN}' ARCH='${ARCH}' \
				CXXFLAGS='${CXXFLAGS}' all

clean:
	make -C basic       clean
	make -C hash       clean
	make -C graphs      clean
	make -C heaps       clean
	make -C searchTrees clean
	make -C advanced    clean
