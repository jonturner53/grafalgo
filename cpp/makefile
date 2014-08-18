# Top level makefile, order of lower-level makes matters
SHELL := /bin/bash
ARCH := -m$(shell getconf LONG_BIT)
BIN := ~/bin
WARN := -Wall -Wno-c++11-extensions
CXXFLAGS := ${WARN} ${ARCH} -O2 -std=c++11

all:
	make -C misc            WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C dataStructures  WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all
	make -C graphAlgorithms WARN='${WARN}' ARCH='${ARCH}' \
				BIN='${BIN}' CXXFLAGS='${CXXFLAGS}' all

clean:
	rm -f lib/*.a
	make -C misc            clean
	make -C dataStructures  clean
	make -C graphAlgorithms clean

